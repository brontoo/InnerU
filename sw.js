/* ============================================================================
   InnerU offline worker
   ----------------------------------------------------------------------------
   Strategy
     * app shell + code (HTML, JS, CSS, JSON): network first, so a push to GitHub
       is picked up immediately, falling back to the cache when there is no wifi
     * large immutable assets (3D models, images, fonts): stale-while-revalidate
   Bump VERSION when the shell changes so old caches are dropped.
   ========================================================================== */
const VERSION = 'inneru-v3';
const SHELL = [
  './', './index.html', './404.html', './manifest.webmanifest',
  './style.css', './exhibit.css', './welcome.css', './muscle.css', './muscle-learning.css',
  './body-atlas.css', './respiratory.css', './integumentary.css', './excretory.css',
  './circulatory.css', './capstone.css', './teacher.css', './review.css', './habit.css', './glossary.css', './mission-art.css', './activity-art.css',
  './content-skeletal.js', './app.js', './anatomy.js', './visuals.js', './body-atlas-ui.js', './circulatory.js',
  './rich-pages.js', './muscle-visuals.js', './muscle-learning.js', './muscle.js',
  './circulatory-integration.js', './respiratory.js', './integumentary.js', './excretory.js',
  './capstone.js', './a11y.js', './teacher.js', './pwa.js', './review.js', './habit.js', './muscle-force.js', './activity-art.js', './mission-visuals.js', './glossary.js', './speech.js', './portal-art.js', './mission-map.js', './content-skeletal.js',
  './favicon.svg', './inneru-mark.svg', './inneru-mark-light.svg'
];
const ASSET_RE = /\.(glb|webp|png|jpg|jpeg|svg|woff2?|ttf)$/i;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;           /* fonts and other CDNs are left alone */

  if (ASSET_RE.test(url.pathname)) {
    event.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(request);
      const fetching = fetch(request).then(response => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => hit);
      return hit || fetching;
    }));
    return;
  }

  event.respondWith(fetch(request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html'))));
});
