// Service worker (PWA): busca sempre da rede e guarda uma cópia para quando estiver sem internet
const CACHE = 'greys-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (evento) => {
  evento.waitUntil(apagarCopiasAntigas());
});

async function apagarCopiasAntigas() {
  const nomes = await caches.keys();
  for (const nome of nomes) {
    if (nome !== CACHE) await caches.delete(nome);
  }
  await self.clients.claim();
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  const doProprioApp = new URL(pedido.url).origin === location.origin;
  // Supabase, fontes e CDN não passam pelo cache
  if (pedido.method !== 'GET' || !doProprioApp) return;
  evento.respondWith(redePrimeiro(pedido));
});

async function redePrimeiro(pedido) {
  try {
    const resposta = await fetch(pedido);
    if (resposta.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(pedido, resposta.clone());
    }
    return resposta;
  } catch (erro) {
    const copia = await caches.match(pedido, { ignoreSearch: true });
    return copia || Response.error();
  }
}
