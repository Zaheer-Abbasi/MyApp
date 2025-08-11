import React from 'react';
import { toast } from 'react-hot-toast'; // ✅ Toast import

function TopBar({ onAdd, onTogglePerf, onSave, onLoginAll }) {
  return (
    <div className="top-bar">
      <div className="logo">
        <i className="fas fa-mobile-alt"></i>
        RealYouTubeDeviceSimulator
      </div>
      <div className="top-actions">
        <button onClick={onAdd}>
          <i className="fas fa-plus-circle"></i> Add Screen
        </button>
        <button onClick={onLoginAll}>
          <i className="fas fa-sign-in-alt"></i> Login All
        </button>
        <button
          onClick={() => {
            if (onSave) {
              onSave();
              toast.success('💾 Sessions saved!');
            }
            if (window.rotateSessionFingerprint) {
              window.rotateSessionFingerprint();
              toast.success('🔄 Fingerprints rotated!');
            }
          }}
        >
          <i className="fas fa-save"></i> Save All
        </button>
        <button onClick={onTogglePerf}>
          <i className="fas fa-bolt"></i> Perf Mode
        </button>
      </div>
    </div>
  );
}

export default TopBar;
