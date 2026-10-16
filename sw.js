/* ============================================================================
   InnerU offline worker
   ----------------------------------------------------------------------------
   Strategy
     * app shell + code (HTML, JS, CSS, JSON): network first, so a push to GitHub
       is picked up immediately, falling back to the cache when there is no wifi
     * large immutable assets (3D models, images, fonts): stale-while-revalidate
   Bump VERSION when the shell changes so old caches are dropped.
   ========================================================================== */
const VERSION = 'inneru-v32';
const SHELL = [
  './', './index.html', './404.html', './manifest.webmanifest',
  './style.css', './exhibit.css', './welcome.css', './home-expedition.css?v=discovery-gallery-1', './connection-art.css?v=everyday-anatomy-1', './body-team.css?v=body-team-1', './detective.css?v=field-lab-1', './student-dashboard.css?v=student-space-1', './muscle.css?v=arm-team-1', './muscle-learning.css', './muscle-pair.css?v=arm-team-1', './muscle-studio.css?v=muscle-studio-1',
  './body-atlas.css', './respiratory.css', './resp-activities.css?v=ventilation-1', './resp-map-art.css?v=resp-anatomy-1', './integumentary.css?v=dermis-anatomy-4', './integ-map-art.css?v=skin-card-art-5', './integ-activities.css?v=skin-quests-6', './excretory.css?v=renal-studies-1', './excretory-art.css?v=renal-studies-1', './exc-map-art.css',
  './circulatory.css', './heart-lab.css?v=heart-studio-1', './circ-route-quest.css?v=circ-route-1', './circ-map-art.css?v=circ-atlas-1', './capstone.css', './skeletal-map-art.css?v=skeletal-studies-1', './skeletal-course.css?v=framework-path-1', './teacher.css', './review.css', './habit.css', './glossary.css',
  './content-skeletal.js', './app.js?v=framework-path-1', './anatomy.js', './visuals.js', './body-atlas-ui.js', './circ-studies.js?v=circ-route-1', './circ-route-quest.js?v=circ-route-1', './circ-activities.js?v=circ-atlas-1', './heart-lab-ui.js?v=heart-studio-1', './heart-explorer.js?v=heart-studio-1', './heart-anatomy.js?v=heart-studio-1', './circulatory.js?v=heart-studio-1', './circ-map-art.js?v=circ-atlas-1',
  './skeletal-map-art.js?v=framework-path-1', './skeletal-activities.js?v=framework-path-1', './skeletal-course.js?v=framework-path-1', './rich-pages.js?v=skeletal-studies-1', './muscle-visuals.js', './muscle-pair.js?v=arm-team-1', './muscle-pair-view.js?v=arm-team-1', './muscle-pair-model.js?v=arm-team-1', './muscle-learning.js?v=arm-team-1', './muscle-atlas-ui.js?v=muscle-studio-1', './muscle.js?v=student-space-1', './muscle-explorer.js?v=muscle-studio-1', './muscle-model.js?v=muscle-studio-1',
  './circulatory-integration.js', './resp-ventilation.js?v=ventilation-1', './resp-activities.js?v=ventilation-1', './respiratory.js?v=resp-quests-2', './resp-map-art.js?v=resp-anatomy-1', './integ-activities.js?v=skin-quests-6', './integumentary.js?v=skin-quests-6', './skin-explorer.js?v=dermis-anatomy-4', './skin-model.js?v=dermis-anatomy-4', './integ-map-art.js?v=skin-card-art-5', './excretory-art.js?v=renal-studies-1', './excretory.js?v=renal-studies-1', './excretory-explorer.js?v=renal-cutaway-5', './excretory-model.js?v=renal-anatomy-2', './exc-map-art.js',
  './capstone.js?v=student-space-1', './home-expedition.js?v=discovery-gallery-1', './connection-art.js?v=everyday-anatomy-1', './body-team.js?v=body-team-1', './detective-data.js?v=field-lab-1', './detective-tools.js?v=field-lab-1', './detective.js?v=field-lab-1', './a11y.js', './teacher.js?v=student-space-1', './learning-progress.js?v=student-space-1', './student-dashboard.js?v=student-space-1', './pwa.js', './review.js', './habit.js?v=field-lab-1', './muscle-force.js', './glossary.js', './speech.js', './content-skeletal.js',
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
