// Service worker do LeituCast Ingrid: o app abre offline. Busca a versão nova na rede e usa a cópia salva sem internet.
// Os livros baixados ficam no IndexedDB e as vozes abertas no Cache Storage (lc-vozes-v1), fora deste cache.
const CACHE = 'leitucast-v8';
const V = '?v=8';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'css/fontes.css', 'css/app.css' + V,
  'js/util.js' + V, 'js/conhecimento.js' + V, 'js/saber.js' + V, 'js/ia-pesos.js' + V, 'js/fontes.js' + V, 'js/ia.js' + V, 'js/formatos.js' + V, 'js/leitor.js' + V,
  'js/narrador.js' + V, 'js/cerebro.js' + V, 'js/infantil.js' + V, 'js/nuvem.js' + V, 'js/app.js' + V, 'js/voz-piper.js' + V, 'vendor/jszip.min.js',
  'img/logo.svg', 'img/icon-192.png', 'img/papel-claro.webp', 'img/papel-escuro.webp', 'img/arte/leitura-almeida-junior-p.webp',
  'fontes/manrope-normal-latin.woff2', 'fontes/fraunces-normal-latin.woff2', 'fontes/literata-normal-latin.woff2', 'fontes/literata-italic-latin.woff2'];
const DEPOIS = ['dados/catalogo.json?v=2', 'vendor/pdf.min.mjs', 'vendor/pdf.worker.min.mjs'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).then(() => c.addAll(DEPOIS).catch(() => null))).catch(() => null));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('leitucast-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // livros e buscas do Gutenberg/Wikisource passam direto (o app guarda os livros no IndexedDB)
  if (/\/(gutenberg|wikisource)\//.test(url.pathname)) return;
  const estatico = /\.(woff2|webp|png|svg|jpg|mjs)$/.test(url.pathname) || url.pathname.includes('/dados/');
  if (estatico) {
    // arquivos que mudam pouco: cache primeiro, atualiza em segundo plano
    e.respondWith(caches.match(req).then((r) => {
      const rede = fetch(req).then((res) => { if (res.ok && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } return res; }).catch(() => r);
      return r || rede;
    }));
    return;
  }
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match(req, { ignoreSearch: true })).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
