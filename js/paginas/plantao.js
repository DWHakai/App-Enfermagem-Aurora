// Telas 3 e 3b - Passagem de Plantão / Evolução de Enfermagem (FUNCIONALIDADE PRINCIPAL)
// Aba "Passagem": salva a passagem e, se estiver escrita, também a evolução.
// Aba "Evolução": salva só a evolução (igual ao Figma).
import { supabase, traduzirErro } from '../supabase.js';
import {
  iniciarTela, listarPacientes, opcoesDePacientes, escolherPaciente, nomesDaEquipe,
  avisoSucesso, mostrarErro, esc, hojeISO, horaAgora, formatarDiaMes, formatarHora,
} from '../comum.js';

const { paciente } = await iniciarTela({
  titulo: 'Evolução / Plantão',
  voltar: '/pages/paciente.html',
  precisaPaciente: true,
});

const form = document.getElementById('form');
const abaPassagem = document.getElementById('aba-passagem');
const abaEvolucao = document.getElementById('aba-evolucao');

// Lista de pacientes: já vem marcado o que foi escolhido no menu
form.paciente.innerHTML = opcoesDePacientes(await listarPacientes());
form.paciente.value = paciente.id;

// Data e hora já vêm preenchidas com o momento atual (dá para mudar)
function preencherAgora() {
  form.data.value = hojeISO();
  form.hora.value = horaAgora();
}
preencherAgora();

// ---------- Último registro: o que o plantão anterior deixou ----------
const ultimos = document.getElementById('ultimos');
const nomes = await nomesDaEquipe();

// O registro mais recente de um tipo ('passagem' ou 'evolucao') do paciente
async function ultimoRegistro(tipo) {
  const { data, error } = await supabase.from('registros_plantao').select('*')
    .eq('paciente_id', Number(form.paciente.value))
    .eq('tipo', tipo)
    .order('data_hora', { ascending: false })
    .limit(1);
  if (error) alert(traduzirErro(error));
  return data && data.length > 0 ? data[0] : null;
}

function itemRegistro(titulo, registro) {
  if (!registro) return `<li class="vazio">${titulo}: nenhum registro ainda.</li>`;
  const quem = esc(nomes[registro.autor_id] || 'Equipe');
  return `
    <li class="evento">
      <div class="quando">${titulo} · ${formatarDiaMes(registro.data_hora)} · ${formatarHora(registro.data_hora)} · ${quem}</div>
      <div class="detalhe">${esc(registro.texto)}</div>
    </li>`;
}

async function mostrarUltimos() {
  const passagem = await ultimoRegistro('passagem');
  const evolucao = await ultimoRegistro('evolucao');
  ultimos.innerHTML = itemRegistro('Passagem de plantão', passagem) + itemRegistro('Evolução', evolucao);
}

// Trocou o paciente no campo: mostra o último registro dele
form.paciente.addEventListener('change', mostrarUltimos);
await mostrarUltimos();

// ---------- Abas ----------
let aba = 'passagem';

function mostrarAba(nova) {
  aba = nova;
  abaPassagem.classList.toggle('ativa', aba === 'passagem');
  abaEvolucao.classList.toggle('ativa', aba === 'evolucao');
  document.getElementById('bloco-passagem').hidden = aba === 'evolucao';
  form.classList.toggle('so-evolucao', aba === 'evolucao'); // caixa da evolução maior
}

abaPassagem.addEventListener('click', () => mostrarAba('passagem'));
abaEvolucao.addEventListener('click', () => mostrarAba('evolucao'));

// Abre na aba que veio no endereço (paciente.html manda ?aba=passagem ou ?aba=evolucao)
mostrarAba(location.search.includes('evolucao') ? 'evolucao' : 'passagem');

// ---------- Salvar ----------
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const passagem = aba === 'passagem' ? form.passagem.value.trim() : '';
  const evolucao = form.evolucao.value.trim();

  if (!passagem && !evolucao) {
    return mostrarErro(form, aba === 'passagem' ? 'Escreva a passagem de plantão ou a evolução.' : 'Escreva a evolução.');
  }
  if ((passagem && passagem.length < 10) || (evolucao && evolucao.length < 10)) {
    return mostrarErro(form, 'Texto muito curto. Escreva pelo menos 10 caracteres.');
  }
  if (!form.data.value || !form.hora.value) return mostrarErro(form, 'Informe data e horário.');

  // "2026-09-26" + "T" + "14:05" = data e hora no fuso do aparelho
  const quando = new Date(`${form.data.value}T${form.hora.value}`);
  const daquiCincoMinutos = new Date(Date.now() + 5 * 60 * 1000); // tolera relógio adiantado
  if (quando > daquiCincoMinutos) return mostrarErro(form, 'Data e horário não podem estar no futuro.');

  const pacienteId = Number(form.paciente.value); // o select devolve texto; o banco espera número
  const registros = [];
  if (passagem) registros.push({ paciente_id: pacienteId, tipo: 'passagem', texto: passagem, data_hora: quando.toISOString() });
  if (evolucao) registros.push({ paciente_id: pacienteId, tipo: 'evolucao', texto: evolucao, data_hora: quando.toISOString() });

  const botao = form.querySelector('[type=submit]');
  botao.disabled = true;
  // Um insert só com as duas linhas: ou o banco grava as duas, ou nenhuma
  const { error } = await supabase.from('registros_plantao').insert(registros);
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  escolherPaciente(pacienteId); // se trocou de paciente aqui, o menu acompanha
  await avisoSucesso();
  form.passagem.value = '';
  form.evolucao.value = '';
  preencherAgora();
  await mostrarUltimos(); // o que acabou de salvar vira o último registro
});
