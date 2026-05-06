import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(console.error);
}

// Block all zoom: pinch, gesture, double-tap
document.addEventListener('gesturestart',  e => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
document.addEventListener('gestureend',    e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// If iOS zooms anyway (e.g. on input focus) — snap back to scale 1 immediately
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (window.visualViewport.scale > 1) {
      const vp = document.querySelector('meta[name=viewport]');
      if (vp) vp.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
