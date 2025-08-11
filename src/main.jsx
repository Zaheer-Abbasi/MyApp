import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';         // ✅ same folder
import './style.css';               // ✅ style.css is in main folder now

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found!');
}
