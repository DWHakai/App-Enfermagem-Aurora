// Tela 9 - Observações
import { supabase, traduzirErro } from '../supabase.js';
import {
  iniciarTela, mostrarPacienteAtual, nomesDaEquipe, avisoSucesso, mostrarErro,
  esc, formatarDiaMes, formatarHora,
} from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Observações', precisaPaciente: true });
mostrarPacienteAtual(paciente);

const lista = document.getElementById('lista');
const form = document.getElementById('form');
const nomes = await nomesDaEquipe();

async function mostrarLista() {
  const { data, error } = await supabase.from('observacoes').select('*')
    .eq('paciente_id', paciente.id)
    .order('criado_em', { ascending: false });
  if (error) return alert(traduzirErro(error));

  if (data.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhuma observação ainda.</li>';
    return;
  }

  // esc() no texto digitado: sem isso, um <script> escrito na observação rodaria aqui
  lista.innerHTML = data.map((o) => `
    <li class="evento">
      <div class="quando">${formatarDiaMes(o.criado_em)} · ${formatarHora(o.criado_em)} · ${esc(nomes[o.autor_id] || 'Equipe')}</div>
      <div class="detalhe">${esc(o.texto)}</div>
    </li>`).join('');
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const texto = form.texto.value.trim();
  if (!texto) return mostrarErro(form, 'Escreva a observação.');
  if (texto.length < 5) return mostrarErro(form, 'A observação está muito curta. Escreva pelo menos 5 caracteres.');

  const botao = form.querySelector('button');
  botao.disabled = true;
  const { error } = await supabase.from('observacoes').insert({ paciente_id: paciente.id, texto: texto });
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  mostrarErro(form, '');
  form.reset();
  await avisoSucesso();
  await mostrarLista();
});

await mostrarLista();
