// Service worker do Ryke Treinos: busca a versão nova na rede e usa a cópia salva quando estiver sem internet.
const CACHE = 'ryke-treinos-v1';
const CORE = ['./', 'index.html', 'estilo.css?v=1', 'fontes.css', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png',
  'js/motor.js?v=1', 'js/exercicios.js?v=1', 'js/conhecimento.js?v=1', 'js/ia-pesos.js?v=1', 'js/ia.js?v=1', 'js/nuvem.js?v=1', 'js/app.js?v=1'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  // só arquivos do próprio site; a nuvem (Supabase) nunca passa pelo cache
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match(req, { ignoreSearch: true })).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
