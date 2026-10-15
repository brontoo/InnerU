/* ============================================================================
   InnerU offline worker
   ----------------------------------------------------------------------------
   Strategy
     * app shell + code (HTML, JS, CSS, JSON): network first, so a push to GitHub
       is picked up immediately, falling back to the cache when there is no wifi
     * large immutable assets (3D models, images, fonts): stale-while-revalidate
   Bump VERSION when the shell changes so old caches are dropped.
   ========================================================================== */
const VERSION = 'inneru-v19';
const SHELL = [
  './', './index.html', './404.html', './manifest.webmanifest',
  './style.css', './exhibit.css', './welcome.css', './muscle.css?v=arm-team-1', './muscle-learning.css', './muscle-pair.css?v=arm-team-1', './muscle-studio.css?v=muscle-studio-1',
  './body-atlas.css', './respiratory.css', './resp-map-art.css', './integumentary.css?v=dermis-anatomy-4', './integ-map-art.css?v=skin-card-art-5', './integ-activities.css?v=skin-quests-6', './excretory.css?v=renal-layout-4', './exc-map-art.css',
  './circulatory.css', './circ-map-art.css', './capstone.css', './skeletal-map-art.css?v=skeletal-studies-1', './teacher.css', './review.css', './habit.css', './glossary.css',
  './content-skeletal.js', './app.js', './anatomy.js', './visuals.js', './body-atlas-ui.js', './circulatory.js', './circ-map-art.js',
  './skeletal-map-art.js?v=skeletal-studies-1', './rich-pages.js?v=skeletal-studies-1', './muscle-visuals.js', './muscle-pair.js?v=arm-team-1', './muscle-pair-view.js?v=arm-team-1', './muscle-pair-model.js?v=arm-team-1', './muscle-learning.js?v=arm-team-1', './muscle-atlas-ui.js?v=muscle-studio-1', './muscle.js?v=muscle-studio-1', './muscle-explorer.js?v=muscle-studio-1', './muscle-model.js?v=muscle-studio-1',
  './circulatory-integration.js', './respiratory.js', './resp-map-art.js', './integ-activities.js?v=skin-quests-6', './integumentary.js?v=skin-quests-6', './skin-explorer.js?v=dermis-anatomy-4', './skin-model.js?v=dermis-anatomy-4', './integ-map-art.js?v=skin-card-art-5', './excretory.js?v=renal-cutaway-5', './excretory-explorer.js?v=renal-cutaway-5', './excretory-model.js?v=renal-anatomy-2', './exc-map-art.js',
  './capstone.js', './a11y.js', './teacher.js', './pwa.js', './review.js', './habit.js?v=skin-quests-6', './muscle-force.js', './glossary.js', './speech.js', './content-skeletal.js',
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
