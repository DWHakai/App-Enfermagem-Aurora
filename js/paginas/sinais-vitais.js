// Tela 5 - Sinais Vitais
import { supabase, traduzirErro } from '../supabase.js';
import {
  iniciarTela, mostrarPacienteAtual, avisoSucesso, mostrarErro,
  formatarNumero, formatarData, formatarHora,
} from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Sinais Vitais', precisaPaciente: true });
mostrarPacienteAtual(paciente);

// Regras de cada sinal (a chave é o name do campo e a coluna do banco):
//   min / max             = valores aceitos (os mesmos do 01-estrutura.sql)
//   normalMin / normalMax = faixa normal; fora dela o cartão fica destacado
//   decimal               = aceita vírgula (só a temperatura)
// ATENÇÃO: as faixas normais precisam ser conferidas com a Enfermagem.
const SINAIS = {
  pa_sist:  { nome: 'Pressão sistólica',       min: 40, max: 300, normalMin: 90,   normalMax: 139 },
  pa_diast: { nome: 'Pressão diastólica',      min: 20, max: 200, normalMin: 60,   normalMax: 89 },
  fc:       { nome: 'Frequência cardíaca',     min: 20, max: 250, normalMin: 60,   normalMax: 100 },
  temp:     { nome: 'Temperatura',             min: 30, max: 45,  normalMin: 35.5, normalMax: 37.7, decimal: true },
  spo2:     { nome: 'Saturação',               min: 50, max: 100, normalMin: 94,   normalMax: 100 },
  fr:       { nome: 'Frequência respiratória', min: 4,  max: 60,  normalMin: 12,   normalMax: 20 },
  dor:      { nome: 'Dor',                     min: 0,  max: 10,  normalMin: 0,    normalMax: 6 },
};

const form = document.getElementById('form');

// true se o valor foi medido e está fora da faixa normal
function foraDoNormal(campo, valor) {
  if (valor === null) return false;
  return valor < SINAIS[campo].normalMin || valor > SINAIS[campo].normalMax;
}

// Um cartão da última aferição. Os valores vêm do banco como números
// (ou "—"), por isso podem ir direto no HTML.
function cartao(rotulo, valor, unidade, destacar) {
  return `
    <div class="sinal ${destacar ? 'alterado' : ''}">
      <div class="rotulo">${rotulo}</div>
      <div class="valor">${valor} <span class="unid">${unidade}</span></div>
    </div>`;
}

async function mostrarUltima() {
  const { data, error } = await supabase.from('sinais_vitais').select('*')
    .eq('paciente_id', paciente.id)
    .order('aferido_em', { ascending: false })
    .limit(1); // só a mais recente
  if (error) return alert(traduzirErro(error));

  const cartoes = document.getElementById('cartoes');
  const ultima = document.getElementById('ultima');
  ultima.classList.toggle('vazio', data.length === 0);
  if (data.length === 0) {
    cartoes.innerHTML = '';
    ultima.textContent = 'Nenhuma aferição registrada ainda.';
    return;
  }

  const s = data[0]; // o que não foi medido vem como null e aparece como "—"
  const pressao = s.pa_sist === null ? '—' : `${s.pa_sist}/${s.pa_diast}`;
  cartoes.innerHTML =
    cartao('Pressão', pressao, 'mmHg', foraDoNormal('pa_sist', s.pa_sist) || foraDoNormal('pa_diast', s.pa_diast)) +
    cartao('Freq. Cardíaca', formatarNumero(s.fc), 'bpm', foraDoNormal('fc', s.fc)) +
    cartao('Temperatura', formatarNumero(s.temp), '°C', foraDoNormal('temp', s.temp)) +
    cartao('Saturação', formatarNumero(s.spo2), '% SpO₂', foraDoNormal('spo2', s.spo2)) +
    cartao('Freq. Resp.', formatarNumero(s.fr), 'irpm', foraDoNormal('fr', s.fr)) +
    cartao('Dor', formatarNumero(s.dor), '/ 10', foraDoNormal('dor', s.dor));
  ultima.textContent = `Última aferição: ${formatarData(s.aferido_em)} · ${formatarHora(s.aferido_em)}`;
}

// Troca entre "ver a última" e "registrar"
function modoRegistrar(ligado) {
  document.getElementById('ver').hidden = ligado;
  form.hidden = !ligado;
}

document.getElementById('abrir').addEventListener('click', () => {
  modoRegistrar(true);
  form.pa_sist.focus();
});

document.getElementById('cancelar').addEventListener('click', () => {
  form.reset();
  mostrarErro(form, '');
  modoRegistrar(false);
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  // Lê cada campo: vazio vira null; com valor, confere se é número e se está na faixa
  const afericao = { paciente_id: paciente.id };
  let preenchidos = 0;

  for (const campo in SINAIS) {
    const regra = SINAIS[campo];
    const texto = form[campo].value.trim().replace(',', '.'); // "36,5" -> "36.5"
    if (texto === '') {
      afericao[campo] = null;
      continue;
    }
    const valor = Number(texto);
    const formatoOk = regra.decimal ? Number.isFinite(valor) : Number.isInteger(valor);
    if (!formatoOk || valor < regra.min || valor > regra.max) {
      form[campo].focus();
      return mostrarErro(form, `${regra.nome}: digite um número entre ${regra.min} e ${regra.max}.`);
    }
    afericao[campo] = valor;
    preenchidos++;
  }

  if (preenchidos === 0) return mostrarErro(form, 'Preencha pelo menos um sinal.');
  if ((afericao.pa_sist === null) !== (afericao.pa_diast === null)) {
    return mostrarErro(form, 'Preencha a pressão completa (sistólica e diastólica).');
  }
  if (afericao.pa_sist !== null && afericao.pa_diast >= afericao.pa_sist) {
    return mostrarErro(form, 'A diastólica deve ser menor que a sistólica.');
  }

  const botao = form.querySelector('[type=submit]');
  botao.disabled = true;
  const { error } = await supabase.from('sinais_vitais').insert(afericao);
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  await avisoSucesso();
  form.reset();
  modoRegistrar(false);
  await mostrarUltima();
});

await mostrarUltima();
