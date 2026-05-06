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

// Prevent iOS auto-zoom on input focus.
// iOS 10+ ignores static user-scalable=no but DOES react to dynamic setAttribute.
// The trick: keep maximum-scale=5 in HTML (so iOS sees a real change when we
// lock it to 1 on input focus), then restore after blur.
const _vp = document.querySelector('meta[name=viewport]');
if (_vp) {
  const _lock   = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
  const _unlock = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
  document.addEventListener('touchstart', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      _vp.setAttribute('content', _lock);
    }
  }, { passive: true });
  document.addEventListener('focusout', () => {
    setTimeout(() => _vp.setAttribute('content', _unlock), 150);
  }, { passive: true });
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
