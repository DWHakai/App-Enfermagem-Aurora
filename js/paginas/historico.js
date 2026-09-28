// Tela 8 - Histórico = TELA DE ACOMPANHAMENTO
// Junta tudo o que foi registrado para o paciente numa linha do tempo,
// do mais recente para o mais antigo.
import { supabase, traduzirErro } from '../supabase.js';
import {
  iniciarTela, mostrarPacienteAtual, nomesDaEquipe, esc,
  formatarDiaMes, formatarHora, formatarNumero,
} from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Histórico', precisaPaciente: true });
mostrarPacienteAtual(paciente);

// Busca todas as linhas de uma tabela que são deste paciente
async function buscar(tabela) {
  const { data, error } = await supabase.from(tabela).select('*').eq('paciente_id', paciente.id);
  if (error) alert(traduzirErro(error));
  return data || [];
}

// "PA 120/80 · FC 88 · T 36,5°C" (só o que foi medido)
function resumoDosSinais(s) {
  const partes = [];
  if (s.pa_sist !== null) partes.push(`PA ${s.pa_sist}/${s.pa_diast}`);
  if (s.fc !== null) partes.push(`FC ${s.fc}`);
  if (s.temp !== null) partes.push(`T ${formatarNumero(s.temp)}°C`);
  if (s.spo2 !== null) partes.push(`SpO₂ ${s.spo2}%`);
  if (s.fr !== null) partes.push(`FR ${s.fr}`);
  if (s.dor !== null) partes.push(`Dor ${s.dor}/10`);
  return partes.join(' · ');
}

const nomes = await nomesDaEquipe();
const registros = await buscar('registros_plantao');
const sinais = await buscar('sinais_vitais');
const medicacoes = await buscar('medicacoes');
const doses = await buscar('administracoes');
const exames = await buscar('exames');
const observacoes = await buscar('observacoes');

// " — Meredith Grey" (quem fez o registro), ou nada se não souber
function autor(id) {
  return nomes[id] ? ` — ${nomes[id]}` : '';
}

// Cada evento da linha do tempo: { quando, titulo, detalhe }
const eventos = [];
eventos.push({ quando: paciente.admissao, titulo: 'Admissão do paciente', detalhe: '' });

for (const r of registros) {
  const tipo = r.tipo === 'passagem' ? 'Passagem de plantão' : 'Evolução de enfermagem';
  eventos.push({ quando: r.data_hora, titulo: tipo + autor(r.autor_id), detalhe: r.texto });
}

for (const s of sinais) {
  eventos.push({ quando: s.aferido_em, titulo: 'Sinais vitais' + autor(s.autor_id), detalhe: resumoDosSinais(s) });
}

for (const dose of doses) {
  const medicacao = medicacoes.find((m) => m.id === dose.medicacao_id);
  const remedio = medicacao ? medicacao.nome : 'medicação';
  eventos.push({ quando: dose.administrado_em, titulo: `Medicação administrada: ${remedio}` + autor(dose.autor_id), detalhe: '' });
}

for (const e of exames) {
  eventos.push({ quando: e.solicitado_em, titulo: `Exame: ${e.nome}` + autor(e.autor_id), detalhe: `Status: ${e.status}` });
}

for (const o of observacoes) {
  eventos.push({ quando: o.criado_em, titulo: 'Observação' + autor(o.autor_id), detalhe: o.texto });
}

// Do mais recente para o mais antigo
eventos.sort((a, b) => new Date(b.quando) - new Date(a.quando));

document.getElementById('lista').innerHTML = eventos.map((e) => `
  <li class="evento">
    <div class="quando">${formatarDiaMes(e.quando)} · ${formatarHora(e.quando)}</div>
    <div>${esc(e.titulo)}</div>
    <div class="detalhe">${esc(e.detalhe)}</div>
  </li>`).join('');
