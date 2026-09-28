// Tela 10 - Perfil
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, escolherPaciente } from '../comum.js';

const { usuario } = await iniciarTela({ titulo: 'Meu Perfil' });

// textContent (e não innerHTML) já protege contra código digitado nos campos
function escrever(id, texto) {
  document.getElementById(id).textContent = texto;
}

// Dados da pessoa: vêm da tabela "perfis" (preenchida quando a conta foi criada)
async function mostrarPerfil() {
  const { data, error } = await supabase.from('perfis').select('*').eq('id', usuario.id);
  if (error) return alert(traduzirErro(error));
  const perfil = data[0];

  escrever('nome', perfil.nome);
  escrever('funcao', perfil.funcao || '');
  escrever('email', usuario.email);
  escrever('setor', perfil.setor || '—');
  escrever('plantao', perfil.plantao || '—');
}

// Quantos pacientes esta pessoa cadastrou
async function contarPacientes() {
  const { data, error } = await supabase.from('pacientes').select('id').eq('autor_id', usuario.id);
  if (error) return;
  const total = data.length;
  escrever('pacientes', `${total} cadastrado${total === 1 ? '' : 's'} por você`);
}

document.getElementById('sair').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return alert(traduzirErro(error));
  escolherPaciente(null); // o próximo login começa sem paciente escolhido
  location.replace('/index.html');
});

await mostrarPerfil();
await contarPacientes();
