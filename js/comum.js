// =====================================================================
//  COMUM: funções que várias telas usam.
//  Cada tela importa só o que precisa, por exemplo:
//    import { iniciarTela, esc } from '../comum.js';
// =====================================================================
import { supabase, traduzirErro } from './supabase.js';

// ---------------------------------------------------------------------
//  SEGURANÇA: escapa o texto digitado antes de colocar no HTML.
//  Sem isso, alguém poderia digitar <script> num campo e rodar código (XSS).
// ---------------------------------------------------------------------
export function esc(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------------------------------------------------------------------
//  VALIDAÇÃO de nome: "Maria Silva" vale; "Maria" ou "M4ria S" não.
//  Aceita letras com acento, espaço, hífen e apóstrofo (D'Ávila).
//  \p{L} = qualquer letra (precisa do "u" no fim da expressão).
// ---------------------------------------------------------------------
export function nomeCompletoValido(nome) {
  const partes = nome.split(' ').filter((parte) => parte !== '');
  return /^[\p{L}' -]+$/u.test(nome) && partes.length >= 2 && partes.every((parte) => parte.length >= 2);
}

// ---------------------------------------------------------------------
//  DATAS E NÚMEROS no padrão brasileiro
// ---------------------------------------------------------------------

// Data de hoje no formato do banco: "2026-09-26" (no fuso do aparelho)
export function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Hora de agora: "14:05"
export function horaAgora() {
  return new Date().toTimeString().slice(0, 5);
}

// "2026-09-26T17:05:00+00:00" -> "26/09/2026"
export function formatarData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// -> "26/09"
export function formatarDiaMes(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// -> "14:05"
export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// 36.5 -> "36,5"   |   vazio -> "—"
export function formatarNumero(numero) {
  if (numero === null || numero === undefined) return '—';
  return String(numero).replace('.', ',');
}

// "1964-03-12" -> 62 (anos completos hoje)
export function calcularIdade(dataNascimento) {
  const nascimento = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  const aniversarioAindaNaoChegou =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aniversarioAindaNaoChegou) anos--;
  return anos;
}

// ---------------------------------------------------------------------
//  LOGIN
// ---------------------------------------------------------------------

// Devolve a conta que está logada (tem .id e .email) ou null se ninguém entrou.
// O Supabase guarda a sessão no navegador, então isto não precisa de internet.
export async function usuarioLogado() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  return null;
}

// ---------------------------------------------------------------------
//  PACIENTE EM ATENDIMENTO: escolhido no menu, vale para todas as telas.
//  Fica guardado no navegador (localStorage).
// ---------------------------------------------------------------------
export function pacienteEscolhido() {
  return localStorage.getItem('greys_paciente');
}

export function escolherPaciente(id) {
  if (id) localStorage.setItem('greys_paciente', id);
  else localStorage.removeItem('greys_paciente');
}

// Todos os pacientes, em ordem alfabética
export async function listarPacientes() {
  const { data, error } = await supabase.from('pacientes').select('*').order('nome');
  if (error) alert(traduzirErro(error));
  return data || [];
}

// Transforma a lista de pacientes nas <option> de um <select>
export function opcoesDePacientes(pacientes) {
  return pacientes
    .map((p) => `<option value="${p.id}">${esc(p.nome)} · Leito ${esc(p.leito || '—')}</option>`)
    .join('');
}

// Nomes da equipe para mostrar quem fez cada registro: { 'id-da-pessoa': 'Meredith Grey' }
export async function nomesDaEquipe() {
  const { data } = await supabase.from('perfis').select('id, nome');
  const nomes = {};
  for (const pessoa of data || []) {
    nomes[pessoa.id] = pessoa.nome;
  }
  return nomes;
}

// ---------------------------------------------------------------------
//  MONTAGEM DE TODA TELA
//  1) exige login  2) busca o paciente escolhido  3) desenha o cabeçalho
//  Opções:
//    titulo          texto do título (com o botão voltar)
//    voltar          para onde o botão voltar leva (padrão: menu)
//    precisaPaciente true = tela de um paciente (Sinais, Exames...)
//    publica         true = não exige login (Criar conta, Setembro Amarelo)
//  Devolve { usuario, paciente }.
// ---------------------------------------------------------------------
export async function iniciarTela({ titulo, voltar = '/pages/menu.html', precisaPaciente = false, publica = false } = {}) {
  const usuario = await usuarioLogado();
  if (!usuario && !publica) return irPara('/index.html');

  let paciente = null;
  if (precisaPaciente) {
    const id = pacienteEscolhido();
    if (id) {
      const { data } = await supabase.from('pacientes').select('*').eq('id', id);
      if (data && data.length > 0) paciente = data[0];
    }
    if (!paciente) {
      escolherPaciente(null);
      return irPara('/pages/menu.html?escolher=1');
    }
  }

  desenharCabecalho(usuario, titulo, voltar);
  document.body.classList.add('pronto'); // mostra a tela (ver "protegida" no estilo.css)
  return { usuario, paciente };
}

// Vai para outra tela e PARA o código desta: devolve uma promessa que
// nunca termina, então o "await iniciarTela()" da tela fica esperando
// para sempre enquanto o navegador troca de página.
function irPara(endereco) {
  location.replace(endereco);
  return new Promise(() => {});
}

// Cabeçalho igual em todas as telas: logo + marca + avatar (+ título)
function desenharCabecalho(usuario, titulo, voltar) {
  const topo = document.getElementById('topo');
  topo.innerHTML = `
    <a class="topo-logo" href="${usuario ? '/pages/menu.html' : '/index.html'}">
      <img src="/img/logo.svg" alt="Início">
    </a>
    <div class="marca">
      <span class="marca-greys">GREY'S</span>
      <span class="marca-anatomy">ANATOMY</span>
      <span class="marca-hospital">HOSPITAL</span>
    </div>
    ${usuario ? '<a class="topo-avatar" href="/pages/perfil.html"><img src="/img/icones/usuario.svg" alt="Meu perfil"></a>' : '<span></span>'}`;

  if (titulo) {
    topo.insertAdjacentHTML('afterend', `
      <div class="titulo-tela">
        <a class="btn-voltar" href="${voltar}"><img src="/img/icones/voltar.svg" alt="Voltar"></a>
        <h1>${esc(titulo)}</h1>
      </div>`);
  }
}

// Faixa "Maria Aparecida Silva · Leito 12   trocar" abaixo do título
export function mostrarPacienteAtual(paciente) {
  document.querySelector('.titulo-tela').insertAdjacentHTML('afterend', `
    <a class="chip-paciente" href="/pages/menu.html?escolher=1">
      <img src="/img/icones/usuario.svg" alt="">
      <span><b>${esc(paciente.nome)}</b> · Leito ${esc(paciente.leito || '—')}</span>
      <small>trocar</small>
    </a>`);
}

// ---------------------------------------------------------------------
//  AVISOS
// ---------------------------------------------------------------------

// Aviso "Salvo com sucesso!" (igual ao do Figma). A tela usa
// "await avisoSucesso()" para esperar a pessoa tocar em OK.
export function avisoSucesso(mensagem = 'Salvo com sucesso!') {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay">
      <div class="overlay-caixa" role="dialog" aria-modal="true">
        <div class="overlay-check"><img src="/img/icones/check.svg" alt=""></div>
        <p>${esc(mensagem)}</p>
        <button class="btn btn-rosa btn-ok" type="button">OK</button>
      </div>
    </div>`);
  const overlay = document.body.lastElementChild;
  const botaoOk = overlay.querySelector('.btn-ok');
  botaoOk.focus();

  return new Promise((terminar) => {
    botaoOk.addEventListener('click', () => {
      overlay.remove();
      terminar();
    });
  });
}

// Mostra um erro no fim do formulário (mensagem vazia = esconde o erro)
export function mostrarErro(form, mensagem) {
  let caixa = form.querySelector('.erro');
  if (!caixa) {
    caixa = document.createElement('p');
    caixa.className = 'erro';
    caixa.setAttribute('role', 'alert');
    form.append(caixa);
  }
  caixa.textContent = mensagem;
  caixa.hidden = !mensagem;
}

// ---------------------------------------------------------------------
//  APP INSTALÁVEL: registra o service worker (arquivo /sw.js)
// ---------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((erro) => console.warn('Service worker:', erro));
}
