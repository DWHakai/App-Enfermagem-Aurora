// Tela 3 - Passagem de Plantão / Evolução
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

form.paciente.innerHTML = opcoesDePacientes(await listarPacientes());
form.paciente.value = paciente.id;

function preencherAgora() {
  form.data.value = hojeISO();
  form.hora.value = horaAgora();
}
preencherAgora();

// último registro do paciente
const ultimos = document.getElementById('ultimos');
const nomes = await nomesDaEquipe();

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

form.paciente.addEventListener('change', mostrarUltimos);
await mostrarUltimos();

// abas
let aba = 'passagem';

function mostrarAba(nova) {
  aba = nova;
  abaPassagem.classList.toggle('ativa', aba === 'passagem');
  abaEvolucao.classList.toggle('ativa', aba === 'evolucao');
  document.getElementById('bloco-passagem').hidden = aba === 'evolucao';
  form.classList.toggle('so-evolucao', aba === 'evolucao');
}

abaPassagem.addEventListener('click', () => mostrarAba('passagem'));
abaEvolucao.addEventListener('click', () => mostrarAba('evolucao'));

// ?aba=evolucao abre direto na evolução
mostrarAba(location.search.includes('evolucao') ? 'evolucao' : 'passagem');

// salvar
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

  const quando = new Date(`${form.data.value}T${form.hora.value}`);
  const daquiCincoMinutos = new Date(Date.now() + 5 * 60 * 1000); // tolera relógio adiantado
  if (quando > daquiCincoMinutos) return mostrarErro(form, 'Data e horário não podem estar no futuro.');

  const pacienteId = Number(form.paciente.value);
  const registros = [];
  if (passagem) registros.push({ paciente_id: pacienteId, tipo: 'passagem', texto: passagem, data_hora: quando.toISOString() });
  if (evolucao) registros.push({ paciente_id: pacienteId, tipo: 'evolucao', texto: evolucao, data_hora: quando.toISOString() });

  const botao = form.querySelector('[type=submit]');
  botao.disabled = true;
  // um insert só: grava as duas linhas ou nenhuma
  const { error } = await supabase.from('registros_plantao').insert(registros);
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  escolherPaciente(pacienteId);
  await avisoSucesso();
  form.passagem.value = '';
  form.evolucao.value = '';
  preencherAgora();
  await mostrarUltimos();
});
