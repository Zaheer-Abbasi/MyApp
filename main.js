const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { getProxy, setProxy } = require('./proxyConfig');

const isDev = !app.isPackaged;
const windows = new Map();

const spoofProfiles = [
  {
    name: "Pixel 6",
    userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 6 Build/SD1A.210817.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    lang: "en-US",
    acceptLang: "en-US,en;q=0.9",
  },
  {
    name: "Samsung Galaxy S22",
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S901B Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    lang: "en-GB",
    acceptLang: "en-GB,en;q=0.8",
  },
  {
    name: "Xiaomi Redmi Note 11",
    userAgent: "Mozilla/5.0 (Linux; Android 12; Redmi Note 11 Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    lang: "en-IN",
    acceptLang: "en-IN,en;q=0.9",
  },
];

function scheduleCacheClear(ses, instanceId) {
  setInterval(() => {
    ses.clearCache().then(() => {
      console.log(`[🧹] Cache cleared for ${instanceId}`);
    });
    ses.clearStorageData({
      storages: ['history'],
    }).then(() => {
      console.log(`[🧹] History cleared for ${instanceId}`);
    });
  }, 10 * 60 * 1000); // every 10 minutes
}

function createWindow() {
  const instanceId = crypto.randomUUID();
  const profile = spoofProfiles[Math.floor(Math.random() * spoofProfiles.length)];
  const instanceProxy = getProxy(instanceId);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      partition: `persist:${instanceId}`,
    },
  });

  // Store reference
  windows.set(instanceId, win);

  win.on('closed', () => {
    windows.delete(instanceId);
  });

  // Load UI
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  const ses = session.fromPartition(`persist:${instanceId}`);

  // Apply proxy
  if (instanceProxy) {
    ses.setProxy({ proxyRules: instanceProxy })
      .then(() => {
        console.log(`[✅] Proxy applied to ${instanceId}: ${instanceProxy}`);
      })
      .catch((err) => {
        console.error(`[❌] Proxy error (${instanceId}):`, err);
      });
  }

  // Spoof headers
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = profile.userAgent;
    details.requestHeaders['Accept-Language'] = profile.acceptLang;
    details.requestHeaders['X-Device-Session'] = instanceId;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Clear cache/history on interval
  scheduleCacheClear(ses, instanceId);

  // Auto-recover
  win.webContents.on('crashed', () => {
    console.warn(`[⚠️] Renderer crashed. Restarting tab: ${instanceId}`);
    windows.delete(instanceId);
    createWindow();
  });
}

// Electron ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit cleanup
app.on('window-all-closed', async () => {
  const sessions = session.getAllSessions?.() || [];
  for (const ses of sessions) {
    try {
      await ses.clearStorageData();
      await ses.clearCache();
      console.log(`[🧨] Cleared session: ${ses.getPartition()}`);
    } catch (e) {
      console.error(`[❌] Failed to clear session: ${e.message}`);
    }
  }
  if (process.platform !== 'darwin') app.quit();
});

// Handle dynamic proxy updates
ipcMain.on('set-proxy', async (event, { proxy, instanceId }) => {
  try {
    const ses = session.fromPartition(`persist:${instanceId}`);
    if (!ses) throw new Error(`No session found for instance: ${instanceId}`);

    await ses.setProxy({ proxyRules: proxy });
    setProxy(proxy, instanceId);

    console.log(`[✅] Proxy applied for ${instanceId}: ${proxy}`);
    event.sender.send('proxy-status-updated', {
      instanceId,
      proxy,
      success: true,
    });
  } catch (err) {
    console.error(`[❌] Proxy error (${instanceId}):`, err);
    event.sender.send('proxy-status-updated', {
      instanceId,
      proxy,
      success: false,
      error: err.message,
    });
  }
});
