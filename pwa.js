/* Register the offline worker. Kept separate from the teacher tools so it can be
   removed or replaced without touching them. */
(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!secure) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Offline support is unavailable:', err.message));
  });
  /* when a new worker takes over, reload once so the student is not left on stale code */
  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return;
    refreshed = true;
    if (document.visibilityState === 'visible') location.reload();
  });
})();
