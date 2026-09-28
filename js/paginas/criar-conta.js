// Criar conta: acesso da equipe de enfermagem
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, mostrarErro, nomeCompletoValido } from '../comum.js';

await iniciarTela({ titulo: 'Criar conta', voltar: '/index.html', publica: true });

const form = document.getElementById('form');

// Devolve o problema da senha, ou '' se ela estiver boa
function problemaDaSenha(senha) {
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) return 'A senha precisa ter letras e números.';
  return '';
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nome = form.nome.value.trim().replace(/\s+/g, ' '); // "Maria   Silva" -> "Maria Silva"
  const email = form.email.value.trim();
  const senha = form.senha.value;

  if (!nome || !email || !senha) return mostrarErro(form, 'Preencha os campos obrigatórios.');
  if (!nomeCompletoValido(nome)) return mostrarErro(form, 'Digite nome e sobrenome, só com letras.');
  if (!form.email.checkValidity()) return mostrarErro(form, 'E-mail inválido.');
  const problema = problemaDaSenha(senha);
  if (problema) return mostrarErro(form, problema);
  if (senha !== form.senha2.value) return mostrarErro(form, 'As senhas não conferem.');

  const botao = form.querySelector('button');
  botao.disabled = true;
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
      // Estes dados vão para a tabela "perfis" pelo gatilho criar_perfil
      // (banco-de-dados/01-estrutura.sql). Campo vazio vai como null.
      data: {
        nome: nome,
        funcao: form.funcao.value,
        setor: form.setor.value.trim() || null,
        plantao: form.plantao.value, // valor do botão de rádio marcado
      },
    },
  });
  botao.disabled = false;

  if (error) return mostrarErro(form, traduzirErro(error));

  // Conta criada mas sem sessão = o Supabase está pedindo confirmação por e-mail
  if (!data.session) {
    return mostrarErro(form, 'Conta criada, mas o Supabase pediu confirmação por e-mail. '
      + 'Desligue "Confirm email" no Supabase (veja docs/publicar-e-testar.md) ou confirme pelo link do e-mail.');
  }
  location.href = '/pages/menu.html';
});
