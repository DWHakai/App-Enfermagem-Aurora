// Tela 7 - Exames
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, mostrarPacienteAtual, avisoSucesso, mostrarErro, esc, formatarData } from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Exames', precisaPaciente: true });
mostrarPacienteAtual(paciente);

const lista = document.getElementById('lista');
const form = document.getElementById('form');
const botao = document.getElementById('solicitar');

// toque no status passa para o próximo
const PROXIMO_STATUS = {
  'Pendente': 'Em análise',
  'Em análise': 'Disponível',
  'Disponível': 'Pendente',
};

const COR_DO_STATUS = {
  'Pendente': 'pendente',
  'Em análise': 'em-analise',
  'Disponível': '',
};

async function mostrarLista() {
  const { data, error } = await supabase.from('exames').select('*')
    .eq('paciente_id', paciente.id)
    .order('solicitado_em', { ascending: false });
  if (error) return alert(traduzirErro(error));

  if (data.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhum exame registrado.</li>';
    return;
  }

  lista.innerHTML = data.map((exame) => `
    <li class="item">
      <img src="/img/icones/documento.svg" alt="">
      <span class="texto">
        <b>${esc(exame.nome)}</b>
        <small>${formatarData(exame.solicitado_em)}</small>
      </span>
      <button class="badge ${COR_DO_STATUS[exame.status]}" type="button"
        data-id="${exame.id}" data-status="${esc(exame.status)}">${esc(exame.status)}</button>
    </li>`).join('');

  for (const badge of lista.querySelectorAll('.badge')) {
    badge.addEventListener('click', () => mudarStatus(badge));
  }
}

async function mudarStatus(badge) {
  const atual = badge.dataset.status;
  if (atual === 'Disponível' && !confirm('Este exame já está Disponível. Voltar para Pendente?')) return;

  badge.disabled = true;
  const { error } = await supabase.from('exames')
    .update({ status: PROXIMO_STATUS[atual] })
    .eq('id', badge.dataset.id);
  if (error) alert(traduzirErro(error));
  await mostrarLista();
}

// 1º toque mostra o campo; 2º toque salva
botao.addEventListener('click', async () => {
  if (form.hidden) {
    form.hidden = false;
    botao.textContent = 'Confirmar solicitação';
    form.nome.focus();
    return;
  }

  const nome = form.nome.value.trim();
  if (!nome) return mostrarErro(form, 'Digite o nome do exame.');
  if (nome.length < 3) return mostrarErro(form, 'Nome do exame muito curto.');

  botao.disabled = true;
  const { error } = await supabase.from('exames').insert({ paciente_id: paciente.id, nome: nome });
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  form.reset();
  form.hidden = true;
  botao.textContent = 'Solicitar exame';
  await avisoSucesso('Exame registrado!');
  await mostrarLista();
});

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  botao.click();
});

await mostrarLista();
