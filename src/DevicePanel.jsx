//DevicePanel.jsx
import React from 'react';
import DeviceFrame from './DeviceFrame';

function DevicePanel({ devices, removeDevice }) {
  return (
    <div className="device-panel" id="deviceContainer">
      {devices.map((device) => (
        <DeviceFrame
          key={device.instanceId}
          device={device}
          removeDevice={removeDevice}
        />
      ))}
    </div>
  );
}

export default DevicePanel;
