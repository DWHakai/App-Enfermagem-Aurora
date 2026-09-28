// Tela 10 - Perfil
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, escolherPaciente } from '../comum.js';

const { usuario } = await iniciarTela({ titulo: 'Meu Perfil' });

function escrever(id, texto) {
  document.getElementById(id).textContent = texto;
}

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

async function contarPacientes() {
  const { data, error } = await supabase.from('pacientes').select('id').eq('autor_id', usuario.id);
  if (error) return;
  const total = data.length;
  escrever('pacientes', `${total} cadastrado${total === 1 ? '' : 's'} por você`);
}

document.getElementById('sair').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return alert(traduzirErro(error));
  escolherPaciente(null);
  location.replace('/index.html');
});

await mostrarPerfil();
await contarPacientes();
