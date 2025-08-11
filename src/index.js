//index.js
import React from 'react'; 
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Explicit extension recommended in Vite
import './style.css';        // Corrected path (if style.css is in the same folder)

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}
