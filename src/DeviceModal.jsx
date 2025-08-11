//DeviceModal.jsx
import React, { useEffect } from "react";
import deviceList from "./deviceData"; // assuming deviceData.js is in src/

const DeviceModal = ({ visible, onClose, onSelect }) => {
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="deviceModalTitle">
      <div className="modal-content">
        <h3 id="deviceModalTitle">Select a Device</h3>
        <div id="deviceList">
          {deviceList.length > 0 ? (
            deviceList.map((device, idx) => (
              <div
                key={idx}
                className="device-option"
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelect(device);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSelect(device);
                    onClose();
                  }
                }}
              >
                {device.brand} – {device.name}
              </div>
            ))
          ) : (
            <p>No devices found.</p>
          )}
        </div>
        <button id="closeModalBtn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default DeviceModal;
