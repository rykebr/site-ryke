// Service worker do Ryke Treinos: busca a versão nova na rede e usa a cópia salva quando estiver sem internet.
const CACHE = 'ryke-treinos-v2';
const V = '?v=2';
const CORE = ['./', 'index.html', 'estilo.css' + V, 'fontes.css', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png',
  'js/motor.js' + V, 'js/exercicios.js' + V, 'js/conhecimento.js' + V, 'js/ia-pesos.js' + V, 'js/ia.js' + V, 'js/cerebro.js' + V, 'js/nuvem.js' + V, 'js/app.js' + V,
  'img/fundo/fundo1.webp', 'img/fundo/fundo2.webp', 'img/fundo/fundo3.webp', 'img/fundo/fundo4.webp', 'img/fundo/fundo5.webp', 'img/fundo/fundo6.webp'];

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
