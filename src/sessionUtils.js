// sessionUtils.js

// Load saved sessions
export function loadSessions() {
  const saved = localStorage.getItem('savedSessions');
  return saved ? JSON.parse(saved) : [];
}

// Save sessions
export function saveSessions(sessions) {
  localStorage.setItem('savedSessions', JSON.stringify(sessions));
}

// 🔁 Rotate and spoof fingerprints (called automatically on Save All)
export function rotateSessionFingerprint() {
  const saved = localStorage.getItem('savedSessions');
  if (!saved) return;

  try {
    const sessionData = JSON.parse(saved);
    const rotated = sessionData.map(device => ({
      ...device,
      userAgent: spoofUserAgent(device.platform, device.brand),
      fingerprint: generateFingerprint()
    }));
    localStorage.setItem('savedSessions', JSON.stringify(rotated));
    console.log("🔄 Fingerprints rotated!");
  } catch (err) {
    console.error("Failed to rotate session fingerprints:", err);
  }
}

// 💡 Generate strong spoofed user-agent per platform
function spoofUserAgent(platform, brand) {
  const uaSamples = {
    Android: [
      "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/115.0.0.0 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 11; Mi 11) AppleWebKit/537.36 Chrome/116.0.0.0 Mobile Safari/537.36"
    ],
    iOS: [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1"
    ],
    Windows: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.5735.199 Safari/537.36",
      "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.5938.132 Safari/537.36"
    ]
  };
  const list = uaSamples[platform] || uaSamples.Android;
  return list[Math.floor(Math.random() * list.length)];
}

// 🧬 Random fingerprint generator (device-specific hash)
function generateFingerprint() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36).substring(2, 10)
  );
}
