import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(console.error);
}

// Prevent iOS pinch-zoom and gesture-zoom
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });

// Prevent iOS auto-zoom on input focus (iOS 10+ ignores static user-scalable=no,
// but re-reads viewport meta on dynamic setAttribute — so we set it on touchstart,
// before the browser triggers zoom)
const _vp = document.querySelector('meta[name=viewport]');
if (_vp) {
  const _noZoom = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
  const _yesZoom = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  document.addEventListener('touchstart', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      _vp.setAttribute('content', _noZoom);
    }
  }, { passive: true });
  document.addEventListener('focusout', () => {
    setTimeout(() => _vp.setAttribute('content', _yesZoom), 150);
  }, { passive: true });
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
