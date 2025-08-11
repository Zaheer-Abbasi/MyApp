const { contextBridge, ipcRenderer } = require('electron');

// Helper to override properties
function override(obj, prop, value) {
  Object.defineProperty(obj, prop, {
    get: () => value,
    configurable: true,
  });
}

function generateFingerprintProfile() {
  const profiles = [
    {
      platform: 'Linux armv8l',
      language: 'en-US',
      deviceMemory: 4,
      hardwareConcurrency: 4,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36',
      gpu: 'Mali-G78 MP14',
      renderer: 'ARM',
      screen: { width: 412, height: 915 },
      timezone: 'America/New_York'
    },
    {
      platform: 'Linux armv8l',
      language: 'en-US',
      deviceMemory: 6,
      hardwareConcurrency: 12,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5897.92 Mobile Safari/537.36',
      gpu: 'Mali-G76',
      renderer: 'Imagination Technologies',
      screen: { width: 1080, height: 2408 },
      timezone: 'Asia/Tokyo',
    },
    {
      platform: 'Linux armv8l',
      language: 'en-US',
      deviceMemory: 12,
      hardwareConcurrency: 12,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Xperia Ace II) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5897.92 Mobile Safari/537.36',
      gpu: 'PowerVR GM9446',
      renderer: 'Qualcomm',
      screen: { width: 1080, height: 2340 },
      timezone: 'Asia/Tokyo',
    },
    {
      platform: 'Linux armv8l',
      language: 'en-US',
      deviceMemory: 6,
      hardwareConcurrency: 12,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5897.92 Mobile Safari/537.36',
      gpu: 'Mali-G57',
      renderer: 'NVIDIA',
      screen: { width: 720, height: 1600 },
      timezone: 'America/New_York',
    },
    {
      platform: 'Linux armv8l',
      language: 'en-GB',
      deviceMemory: 6,
      hardwareConcurrency: 6,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.120 Mobile Safari/537.36',
      gpu: 'Adreno 660',
      renderer: 'Qualcomm',
      screen: { width: 360, height: 800 },
      timezone: 'Europe/London',
    },
    {
      platform: 'Linux armv8l',
      language: 'en-US',
      deviceMemory: 8,
      hardwareConcurrency: 8,
      vendor: 'Google Inc.',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5897.92 Mobile Safari/537.36',
      gpu: 'Mali-G710',
      renderer: 'ARM',
      screen: { width: 390, height: 844 },
      timezone: 'Asia/Tokyo',
    }
  ];
  return profiles[Math.floor(Math.random() * profiles.length)];
}

const spoofProfile = generateFingerprintProfile();

contextBridge.exposeInMainWorld('spoofing', {
  enableSpoofing: () => {
    try {
      const nav = navigator;
      const screenObj = screen;

      override(nav, 'platform', spoofProfile.platform);
      override(nav, 'language', spoofProfile.language);
      override(nav, 'languages', [spoofProfile.language, 'en']);
      override(nav, 'deviceMemory', spoofProfile.deviceMemory);
      override(nav, 'hardwareConcurrency', spoofProfile.hardwareConcurrency);
      override(nav, 'vendor', spoofProfile.vendor);
      override(nav, 'webdriver', false);
      override(nav, 'doNotTrack', '1');
      override(nav, 'userAgent', spoofProfile.userAgent);

      window.chrome = {
        runtime: {},
        app: { isInstalled: false },
        webstore: { onInstallStageChanged: {}, onDownloadProgress: {} }
      };

      override(screenObj, 'width', spoofProfile.screen.width);
      override(screenObj, 'height', spoofProfile.screen.height);
      override(screenObj, 'availWidth', spoofProfile.screen.width);
      override(screenObj, 'availHeight', spoofProfile.screen.height);

      window.RTCPeerConnection = undefined;
      window.webkitRTCPeerConnection = undefined;

      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const ctx = getContext.apply(this, args);
        if (!ctx) return ctx;
        const getImageData = ctx.getImageData;
        ctx.getImageData = function (...imgArgs) {
          const data = getImageData.apply(this, imgArgs);
          for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] += Math.floor(Math.random() * 5);
          }
          return data;
        };
        return ctx;
      };

      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (param) {
        if (param === 37445) return spoofProfile.renderer;
        if (param === 37446) return spoofProfile.gpu;
        return getParameter.call(this, param);
      };

      if (nav.userAgentData) {
        override(nav.userAgentData, 'platform', 'Android');
        override(nav.userAgentData, 'mobile', true);
        override(nav.userAgentData, 'brands', [{ brand: 'Google Chrome', version: '113' }]);
        override(nav.userAgentData, 'getHighEntropyValues', async () => ({
          architecture: 'arm',
          model: 'Pixel 6',
          platform: 'Android',
          uaFullVersion: '113.0.5672.121'
        }));
      }

      override(Intl.DateTimeFormat.prototype, 'resolvedOptions', () => () => ({
        timeZone: spoofProfile.timezone
      }));

      if (navigator.permissions) {
        navigator.permissions.query = async () => ({ state: 'granted' });
      }

      override(nav, 'plugins', { length: 3 });
      override(nav, 'mimeTypes', { length: 2 });

      const OriginalNumberFormat = Intl.NumberFormat;
      Intl.NumberFormat = function (locale, options = {}) {
        options.localeMatcher = 'best fit';
        return new OriginalNumberFormat(locale, options);
      };

      navigator.getBattery = () =>
        Promise.resolve({ charging: true, chargingTime: 0, dischargingTime: Infinity, level: 1 });

      // 🎯 UI: Proxy Button
      window.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          position:fixed;
          top:10px;
          right:10px;
          z-index:9999;
          font-family:sans-serif;
          font-size:12px;
          text-align:right;
        `;

        const btn = document.createElement('button');
        btn.innerText = 'Set Proxy';
        btn.style.cssText = `
          padding:6px 12px;
          margin-bottom:4px;
          border:none;
          background:#009688;
          color:#fff;
          border-radius:4px;
          cursor:pointer;
        `;

        const display = document.createElement('div');
        display.innerText = 'Proxy: Not set';
        display.style.cssText = `
          color:#333;
          background:#f5f5f5;
          padding:5px 10px;
          border-radius:5px;
          border:1px solid #ccc;
        `;

        btn.onclick = () => {
          const proxyUrl = prompt("Enter proxy (e.g. 127.0.0.1:8080):");
          if (proxyUrl) {
            display.innerText = `Proxy: ${proxyUrl}`;
            ipcRenderer.send('set-proxy', {
              proxy: proxyUrl,
              instanceId: window.location.hash?.substring(1) || 'default'
            });
          }
        };

        wrapper.appendChild(btn);
        wrapper.appendChild(display);
        document.body.appendChild(wrapper);
      });

      console.log('✅ Advanced spoofing + Proxy UI ready');
    } catch (err) {
      console.error('❌ Spoofing error:', err);
    }
  }
});

// ✅ Also expose proxy API for React components
contextBridge.exposeInMainWorld('electronAPI', {
  setProxy: (proxy, instanceId) => {
    ipcRenderer.send('set-proxy', { proxy, instanceId });
  }
});
