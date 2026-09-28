// =====================================================================
//  SERVICE WORKER: é o que deixa o site ser instalado como APP.
//  Fica na raiz para valer para o app inteiro.
//
//  Estratégia "rede primeiro": sempre busca a versão mais nova do arquivo
//  e guarda uma cópia; sem internet, usa a cópia guardada.
//  Os dados do banco (Supabase) NUNCA passam por aqui.
//  Mudou algo grande? Troque o número em CACHE para apagar as cópias velhas.
// =====================================================================
const CACHE = 'greys-v3';

// Versão nova instalada: ativa logo, sem esperar fechar as abas
self.addEventListener('install', () => self.skipWaiting());

// Ao ativar: apaga as cópias das versões antigas
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

// Todo arquivo que o app pede passa por aqui
self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  const doProprioApp = new URL(pedido.url).origin === location.origin;
  // Só cuida dos arquivos do próprio app; Supabase, fontes e CDN passam direto
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
    // Sem internet: devolve a cópia guardada (se tiver)
    const copia = await caches.match(pedido, { ignoreSearch: true });
    return copia || Response.error();
  }
}
