// Funções usadas por várias telas
import { supabase, traduzirErro } from './supabase.js';

// evita XSS: texto digitado não vira HTML
export function esc(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// nome e sobrenome, só letras
export function nomeCompletoValido(nome) {
  const partes = nome.split(' ').filter((parte) => parte !== '');
  return /^[\p{L}' -]+$/u.test(nome) && partes.length >= 2 && partes.every((parte) => parte.length >= 2);
}

export function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function horaAgora() {
  return new Date().toTimeString().slice(0, 5);
}

export function formatarData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatarDiaMes(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatarNumero(numero) {
  if (numero === null || numero === undefined) return '—';
  return String(numero).replace('.', ',');
}

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

export async function usuarioLogado() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  return null;
}

// paciente escolhido no menu (vale para todas as telas)
export function pacienteEscolhido() {
  return localStorage.getItem('greys_paciente');
}

export function escolherPaciente(id) {
  if (id) localStorage.setItem('greys_paciente', id);
  else localStorage.removeItem('greys_paciente');
}

export async function listarPacientes() {
  const { data, error } = await supabase.from('pacientes').select('*').order('nome');
  if (error) alert(traduzirErro(error));
  return data || [];
}

export function opcoesDePacientes(pacientes) {
  return pacientes
    .map((p) => `<option value="${p.id}">${esc(p.nome)} · Leito ${esc(p.leito || '—')}</option>`)
    .join('');
}

// { id: nome } para mostrar quem fez cada registro
export async function nomesDaEquipe() {
  const { data } = await supabase.from('perfis').select('id, nome');
  const nomes = {};
  for (const pessoa of data || []) {
    nomes[pessoa.id] = pessoa.nome;
  }
  return nomes;
}

// Toda tela começa por aqui: confere o login, busca o paciente e monta o cabeçalho
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
  document.body.classList.add('pronto');
  return { usuario, paciente };
}

// a promessa nunca termina, então o resto da tela não roda enquanto a página troca
function irPara(endereco) {
  location.replace(endereco);
  return new Promise(() => {});
}

function desenharCabecalho(usuario, titulo, voltar) {
  const topo = document.getElementById('topo');
  topo.innerHTML = `
    <a class="topo-logo" href="${usuario ? '/pages/menu.html' : '/index.html'}">
      <img src="/img/logo.png" alt="Início">
    </a>
    <div class="marca">
      <span class="marca-topo">HOSPITAL</span>
      <span class="marca-nome">AURORA</span>
      <span class="marca-sub">MEDICAL CENTER</span>
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

export function mostrarPacienteAtual(paciente) {
  document.querySelector('.titulo-tela').insertAdjacentHTML('afterend', `
    <a class="chip-paciente" href="/pages/menu.html?escolher=1">
      <img src="/img/icones/usuario.svg" alt="">
      <span><b>${esc(paciente.nome)}</b> · Leito ${esc(paciente.leito || '—')}</span>
      <small>trocar</small>
    </a>`);
}

// espera a pessoa tocar em OK
export function avisoSucesso(mensagem = 'Salvo com sucesso!') {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay">
      <div class="overlay-caixa" role="dialog" aria-modal="true">
        <div class="overlay-check"><img src="/img/icones/check.svg" alt=""></div>
        <p>${esc(mensagem)}</p>
        <button class="btn btn-principal btn-ok" type="button">OK</button>
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

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((erro) => console.warn('Service worker:', erro));
}

// Botão "Instalar o app no celular" (Login e Perfil)
const caixaInstalar = document.getElementById('instalar');
const jaInstalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ehIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
const ehAndroid = /Android/.test(navigator.userAgent);
let pedidoDeInstalacao = null;

function explicarInstalacao(texto) {
  document.getElementById('instalar-dica').textContent = texto;
}

if (caixaInstalar && !jaInstalado) {
  caixaInstalar.hidden = !(ehIphone || ehAndroid);

  // Chrome/Android: guarda o pedido de instalação para o botão usar
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    pedidoDeInstalacao = evento;
    caixaInstalar.hidden = false;
  });

  document.getElementById('instalar-botao').addEventListener('click', async () => {
    if (pedidoDeInstalacao) {
      pedidoDeInstalacao.prompt();
      const { outcome } = await pedidoDeInstalacao.userChoice;
      pedidoDeInstalacao = null;
      if (outcome === 'accepted') caixaInstalar.hidden = true;
      return;
    }
    if (ehIphone) {
      explicarInstalacao('No Safari, toque no botão Compartilhar (o quadrado com a seta para cima) e depois em "Adicionar à Tela de Início".');
    } else {
      explicarInstalacao('Abra este site no Chrome, toque nos três pontinhos (⋮) lá em cima e depois em "Instalar app".');
    }
  });

  window.addEventListener('appinstalled', () => { caixaInstalar.hidden = true; });
}
