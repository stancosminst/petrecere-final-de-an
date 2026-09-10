/* Service worker — aplicația funcționează complet offline,
   dar se și actualizează singură de la prima deschidere cu internet.

   Strategia:
   - fișierele aplicației (html / css / js / manifest) → încearcă rețeaua,
     cu limită de timp; dacă nu răspunde la timp sau nu ai internet, servește
     din cache. Așa vezi versiunea nouă imediat, fără să pierzi pornirea offline.
   - iconițele → direct din cache (nu se schimbă niciodată).
*/

const CACHE = 'petrecere-v3';

const SHELL = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'manifest.webmanifest'
];

const ICONS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

/* cât aștept rețeaua înainte să pornesc din cache (ms) */
const NET_TIMEOUT = 2500;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.concat(ICONS)))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* fetch cu limită de timp și fără cache-ul HTTP al browserului
   (altfel GitHub Pages poate întoarce o copie veche de până la 10 minute) */
function fetchFresh(req, ms) {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      ctrl.abort();
      reject(new Error('timeout'));
    }, ms);
    fetch(req, { signal: ctrl.signal, cache: 'no-store' })
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetchFresh(req, NET_TIMEOUT);
    if (res && res.ok) {
      cache.put(req, res.clone());
      return res;
    }
    throw new Error('răspuns ' + (res && res.status));
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const idx = await cache.match('index.html');
      if (idx) return idx;
    }
    throw e;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // ce nu e al nostru, lasă browserul

  if (url.pathname.includes('/icons/')) e.respondWith(cacheFirst(req));
  else e.respondWith(networkFirst(req));
});
