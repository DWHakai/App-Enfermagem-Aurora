// Tela 1 - Login
import { supabase, traduzirErro } from '../supabase.js';
import { usuarioLogado, mostrarErro } from '../comum.js';

// Já está logado? Vai direto para o menu.
if (await usuarioLogado()) location.replace('/pages/menu.html');

const form = document.getElementById('form');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault(); // não deixa o formulário recarregar a página
  const email = form.email.value.trim();
  const senha = form.senha.value;
  if (!email || !senha) return mostrarErro(form, 'Preencha e-mail e senha.');
  if (!form.email.checkValidity()) return mostrarErro(form, 'E-mail inválido.');

  const botao = form.querySelector('button');
  botao.disabled = true; // evita dois cliques seguidos
  const { error } = await supabase.auth.signInWithPassword({ email: email, password: senha });
  botao.disabled = false;

  if (error) return mostrarErro(form, traduzirErro(error));
  location.href = '/pages/menu.html';
});
