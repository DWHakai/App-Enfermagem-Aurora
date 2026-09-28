// Tela 6 - Medicações: a enfermagem transcreve a prescrição (um horário por linha)
// e checa as doses dadas no dia.
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, mostrarPacienteAtual, avisoSucesso, mostrarErro, esc, hojeISO } from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Medicações', precisaPaciente: true });
mostrarPacienteAtual(paciente);

const lista = document.getElementById('lista');
const botaoChecar = document.getElementById('checar');
const form = document.getElementById('form');

async function mostrarLista() {
  // Duas buscas: as medicações e as doses já checadas HOJE.
  // Cada resposta do Supabase é um objeto com .data e .error
  const medicacoes = await supabase.from('medicacoes').select('*')
    .eq('paciente_id', paciente.id)
    .order('horario');
  const dosesDeHoje = await supabase.from('administracoes').select('medicacao_id')
    .eq('paciente_id', paciente.id)
    .eq('dia', hojeISO());

  const erro = medicacoes.error || dosesDeHoje.error;
  if (erro) return alert(traduzirErro(erro));

  if (medicacoes.data.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhuma medicação. Use "Adicionar da prescrição".</li>';
    return;
  }

  lista.innerHTML = medicacoes.data.map((m) => {
    // Dose já checada hoje: aparece marcada e travada
    const checada = dosesDeHoje.data.some((dose) => dose.medicacao_id === m.id);
    let detalhes = m.via || '';
    if (m.frequencia) detalhes += ' · ' + m.frequencia;

    return `
      <li class="item ${checada ? 'feito' : ''}">
        <span class="hora">${m.horario.slice(0, 5)}</span>
        <span class="texto">
          <b>${esc(m.nome)}</b>
          <small>${esc(detalhes)}</small>
        </span>
        <label class="caixa-check">
          <input type="checkbox" value="${m.id}" ${checada ? 'checked disabled' : ''} aria-label="${esc(m.nome)}">
          <span><img src="/img/icones/check.svg" alt=""></span>
        </label>
      </li>`;
  }).join('');
}

// "Checar medicação": grava as doses marcadas agora
botaoChecar.addEventListener('click', async () => {
  const marcadas = lista.querySelectorAll('input:checked:not(:disabled)');
  if (marcadas.length === 0) return alert('Marque as medicações que foram administradas.');

  const doses = [];
  for (const caixa of marcadas) {
    doses.push({ medicacao_id: Number(caixa.value), paciente_id: paciente.id, dia: hojeISO() });
  }

  botaoChecar.disabled = true;
  // O banco recusa a mesma dose duas vezes no dia (unique no 01-estrutura.sql)
  const { error } = await supabase.from('administracoes').insert(doses);
  botaoChecar.disabled = false;

  if (error) alert(traduzirErro(error));
  else await avisoSucesso(marcadas.length > 1 ? `${marcadas.length} doses checadas!` : 'Dose checada!');
  await mostrarLista();
});

// "Adicionar da prescrição"
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nome = form.nome.value.trim();
  if (!nome || !form.horario.value) return mostrarErro(form, 'Informe o medicamento e o horário.');
  if (nome.length < 3) return mostrarErro(form, 'Nome do medicamento muito curto.');

  const botao = form.querySelector('button');
  botao.disabled = true;
  const { error } = await supabase.from('medicacoes').insert({
    paciente_id: paciente.id,
    nome: nome,
    via: form.via.value,
    frequencia: form.frequencia.value.trim() || null,
    horario: form.horario.value,
  });
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  form.reset();
  form.closest('details').open = false; // fecha o "Adicionar da prescrição"
  await avisoSucesso();
  await mostrarLista();
});

await mostrarLista();
