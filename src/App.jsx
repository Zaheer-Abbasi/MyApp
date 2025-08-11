// src/App.jsx
import React, { useEffect, useState } from "react";
import TopBar from "./TopBar";
import DeviceFrame from "./DeviceFrame";
import deviceList from "./deviceData";
import { saveSessions, loadSessions } from "./sessionUtils";
import { nanoid } from "nanoid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style.css";

function App() {
  const [devices, setDevices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyInput, setProxyInput] = useState("");
  const [activeProxy, setActiveProxy] = useState("");

  const createDeviceScreen = async (device, id = null, url = null) => {
    const instanceId = id || `dev-${nanoid()}`;
    const deviceData = {
      ...device,
      instanceId,
      url: url || "https://www.google.com",
    };
    setDevices((prev) => {
      const updated = [...prev, deviceData];
      saveSessions(updated);
      toast.success("Device added");
      return updated;
    });
  };

  const removeDevice = (id) => {
    const confirm = window.confirm("Are you sure you want to remove this device?");
    if (!confirm) return;

    setDevices((prev) => {
      const updated = prev.filter((d) => d.instanceId !== id);
      saveSessions(updated);
      toast.info("Device removed");
      return updated;
    });
  };

  useEffect(() => {
    loadSessions(deviceList, createDeviceScreen);
  }, []);

  const handleLoginAll = () => {
    document.querySelectorAll("webview").forEach((wv) => {
      try {
        wv.addEventListener("dom-ready", () => {
          wv.loadURL("https://accounts.google.com/ServiceLogin?service=youtube");
        });
      } catch (err) {
        console.error("Login load failed:", err);
        toast.error("Login failed on one or more devices.");
      }
    });
    toast.success("Login initiated on all devices");
  };

  const togglePerfMode = () => {
    document.body.classList.toggle("perf-mode");
    toast("Performance mode toggled");
  };

  const handleSetProxy = () => {
    setActiveProxy(proxyInput);
    setShowProxyModal(false);
    toast.success("Proxy has been applied!");
  };

  const handleSaveSession = () => {
    saveSessions(devices);
    toast.success("Session saved successfully!");
  };

  return (
    <div className="main-wrapper">
      <TopBar
        onAdd={() => setShowModal(true)}
        onSave={handleSaveSession}
        onLoginAll={handleLoginAll}
        onTogglePerf={togglePerfMode}
        onSetProxy={() => setShowProxyModal(true)}
      />

      <div className="content-wrapper">
        {activeProxy && (
          <div className="proxy-banner">
            <strong>Proxy Active:</strong> {activeProxy}
          </div>
        )}
        <div className="device-panel">
          {devices.map((device, index) => (
            <DeviceFrame
              key={`${device.instanceId}-${index}`}
              device={device}
              removeDevice={removeDevice}
              activeProxy={activeProxy}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Select a Device</h3>
            <div id="deviceList">
              {deviceList.map((device, idx) => (
                <div
                  className="device-option"
                  key={`modal-${idx}`}
                  onClick={() => {
                    createDeviceScreen(device);
                    setShowModal(false);
                  }}
                >
                  {device.brand} - {device.name}
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showProxyModal && (
        <div className="proxy-modal">
          <div className="proxy-modal-content">
            <h3>Set Proxy</h3>
            <input
              type="text"
              placeholder="http://123.123.123.123:8080"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleSetProxy}>Apply Proxy</button>
              <button onClick={() => setShowProxyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;
