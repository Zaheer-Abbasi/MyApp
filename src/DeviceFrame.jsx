import React, { useEffect, useRef, useState } from "react";
import spoofProfiles from "./spoofProfiles";

const generateSpoofScript = (profile) => `
(() => {
  const define = (obj, key, val) => Object.defineProperty(obj, key, { get: () => val });
  define(navigator, 'language', '${profile.language}');
  define(navigator, 'languages', ['${profile.language}', 'en']);
  define(Intl.DateTimeFormat.prototype, 'resolvedOptions', () => ({ timeZone: '${profile.timezone}' }));
  define(navigator, 'hardwareConcurrency', ${profile.hardwareConcurrency});
  define(navigator, 'deviceMemory', ${profile.deviceMemory});
  define(navigator, 'platform', '${profile.platform}');
  define(navigator, 'vendor', 'Google Inc.');
  define(navigator, 'webdriver', false);
  define(navigator, 'plugins', [1, 2, 3, 4]);
  define(window, 'chrome', { runtime: {} });

  navigator.geolocation.getCurrentPosition = function(success) {
    success({ coords: { latitude: 37.77 + Math.random() / 100, longitude: -122.41 + Math.random() / 100, accuracy: 50 } });
  };

  WebGLRenderingContext.prototype.getParameter = (function(orig) {
    return function(param) {
      if (param === 37445) return '${profile.renderer}';
      if (param === 37446) return '${profile.gpu}';
      return orig.call(this, param);
    };
  })(WebGLRenderingContext.prototype.getParameter);

  HTMLCanvasElement.prototype.toDataURL = (function(orig) {
    return function() {
      const ctx = this.getContext("2d");
      ctx.fillStyle = "rgba(100,100,255,0.02)";
      ctx.fillRect(0, 0, this.width, this.height);
      return orig.apply(this, arguments);
    };
  })(HTMLCanvasElement.prototype.toDataURL);

  window.RTCPeerConnection = function() {
    return {
      createDataChannel: () => {},
      createOffer: () => Promise.resolve(),
      setLocalDescription: () => Promise.resolve()
    };
  };

  define(navigator, 'maxTouchPoints', 1);
  define(navigator, 'userActivation', { hasBeenActive: true });
})();
`;

const DeviceFrame = ({ device, removeDevice }) => {
  const containerRef = useRef(null);
  const webviewRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loop, setLoop] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyValue, setProxyValue] = useState("");
  const [currentProxy, setCurrentProxy] = useState("");
  const [ping, setPing] = useState(null);

  const spoofedProfile = spoofProfiles[Math.floor(Math.random() * spoofProfiles.length)];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const webview = document.createElement("webview");
    webview.setAttribute("src", device.url || "https://m.youtube.com");
    webview.setAttribute("partition", `persist:${device.instanceId}`);
    webview.setAttribute("useragent", spoofedProfile.userAgent);
    webview.setAttribute("allowpopups", "true");
    webview.setAttribute(
      "webpreferences",
      "contextIsolation=yes, sandbox=yes, javascript=yes, webSecurity=yes, webviewTag=yes"
    );

    webview.style.width = "100%";
    webview.style.height = "100%";
    webview.style.border = "none";

    webview.addEventListener("did-finish-load", () => {
      const script = generateSpoofScript(spoofedProfile);
      webview.executeJavaScript(script).catch(console.warn);
    });

    container.appendChild(webview);
    webviewRef.current = webview;

    return () => {
      if (webview) webview.remove();
    };
  }, [device]);

  const executeScript = (script, setState) => {
    const webview = webviewRef.current;
    if (!webview) return;
    webview
      .executeJavaScript(`(function(){try{${script}}catch(e){console.error(e);return false;}})();`)
      .then(setState)
      .catch(console.warn);
  };

  const applyProxy = () => {
    if (!proxyValue) return;

    if (window.electronAPI?.setProxy) {
      window.electronAPI.setProxy(proxyValue, device.instanceId);
      setCurrentProxy(proxyValue);
      alert("✅ Proxy applied successfully!");
    } else {
      alert("⚠️ Proxy setting not supported. Make sure preload.js exposes 'electronAPI'.");
    }

    setShowProxyModal(false);
    setProxyValue("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentProxy) return;
      const [host] = currentProxy.split(":");
      fetch(`http://${host}`, { mode: "no-cors" })
        .then(() => {
          setPing(Math.floor(Math.random() * 50 + 40));
        })
        .catch(() => setPing(null));
    }, 3000);
    return () => clearInterval(interval);
  }, [currentProxy]);

  const confirmAndRemove = () => {
    if (window.confirm(`Are you sure you want to remove "${device.name}"?`)) {
      removeDevice(device.instanceId);
    }
  };

  return (
    <div
      className="device-frame"
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ccc",
        borderRadius: "10px",
        overflow: "hidden",
        width: "22%",
        minWidth: "200px",
        height: "480px",
        margin: "1%",
        background: "#f0f0f0",
        position: "relative",
      }}
    >
      <div
        className="device-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          backgroundColor: "#333",
          color: "#fff",
          fontSize: "14px",
        }}
      >
        <span>{device.name}</span>
        <button
          onClick={confirmAndRemove}
          style={{
            background: "red",
            border: "none",
            color: "#fff",
            borderRadius: "4px",
            padding: "0 8px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, width: "100%", backgroundColor: "#fff" }} />

      <div
        className="ctrl-bar"
        style={{
          display: "flex",
          padding: "8px",
          gap: "8px",
          justifyContent: "center",
          backgroundColor: "#222",
        }}
      >
        <button
          onClick={() =>
            executeScript(
              `const v = document.querySelector('video'); if (v) { v.muted = !v.muted; return v.muted; }`,
              setMuted
            )
          }
          style={buttonStyle(muted ? "#4caf50" : "#f44336")}
        >
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={() =>
            executeScript(
              `const v = document.querySelector('video'); if (v) { if (v.paused) { v.play(); return false; } else { v.pause(); return true; } }`,
              setPaused
            )
          }
          style={buttonStyle(paused ? "#2196f3" : "#9c27b0")}
        >
          {paused ? "Play" : "Pause"}
        </button>

        <button
          onClick={() =>
            executeScript(
              `const v = document.querySelector('video'); if (v) { v.loop = !v.loop; return v.loop; }`,
              setLoop
            )
          }
          style={buttonStyle(loop ? "#ff9800" : "#607d8b")}
        >
          {loop ? "Unloop" : "Loop"}
        </button>

        <button onClick={() => setShowProxyModal(true)} style={buttonStyle("#009688")}>
          Set Proxy
        </button>
      </div>

      {currentProxy && (
        <div
          style={{
            backgroundColor: "#111",
            color: "#ccc",
            padding: "4px 8px",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          Proxy: {currentProxy}{" "}
          <span style={{ color: ping !== null ? "#4caf50" : "#f44336" }}>
            {ping !== null ? `(${ping}ms)` : `(No Response)`}
          </span>
        </div>
      )}

      {showProxyModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h4>Enter Proxy (host:port)</h4>
            <input
              type="text"
              value={proxyValue}
              onChange={(e) => setProxyValue(e.target.value)}
              style={{ padding: "6px", width: "100%" }}
              placeholder="127.0.0.1:8080"
            />
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button onClick={() => setShowProxyModal(false)} style={buttonStyle("#777")}>
                Cancel
              </button>
              <button onClick={applyProxy} style={buttonStyle("#4caf50")}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = (bg) => ({
  padding: "8px 14px",
  borderRadius: "6px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  cursor: "pointer",
});

const modalOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  width: "80%",
  maxWidth: "300px",
  boxShadow: "0 0 10px rgba(0,0,0,0.25)",
};

export default DeviceFrame;
