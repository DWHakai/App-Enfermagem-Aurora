// Conexão com o banco (Supabase)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';

// chave pública (publishable): sem login não acessa nada. Nunca colocar a secret key aqui
const SUPABASE_URL = 'https://dhruusyqzrdjjrwkczpz.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_CEZWmRSsAjP046nrgL-kRg_r7aQLsv2';

if (!SUPABASE_URL || !SUPABASE_CHAVE) {
  alert('Falta configurar o banco: preencha SUPABASE_URL e SUPABASE_CHAVE no arquivo js/supabase.js (Supabase > seu projeto > botão "Connect").');
  throw new Error('Supabase não configurado');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE);

// erros do Supabase vêm em inglês
export function traduzirErro(error) {
  const mensagem = error.message || String(error);
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('User already registered')) return 'Este e-mail já tem conta. Faça login.';
  if (mensagem.includes('Password should be')) return 'Senha fraca: use pelo menos 8 caracteres, com letras e números.';
  if (mensagem.includes('is invalid') || mensagem.includes('Unable to validate email')) return 'E-mail inválido.';
  if (mensagem.includes('Email not confirmed')) return 'E-mail não confirmado. Desligue "Confirm email" no Supabase (Authentication > Sign In / Providers > Email).';
  if (mensagem.includes('Signups not allowed')) return 'A criação de contas está desligada no Supabase.';
  if (mensagem.includes('rate limit') || mensagem.includes('security purposes')) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  if (mensagem.includes('duplicate key')) return 'Essa dose já foi checada hoje.';
  if (mensagem.includes('violates check constraint')) return 'Algum valor está fora do permitido. Confira os campos.';
  // sem internet (Chrome / Firefox / Safari)
  if (mensagem.includes('Failed to fetch') || mensagem.includes('NetworkError') || mensagem.includes('Load failed')) {
    return 'Sem conexão com o servidor. Verifique a internet.';
  }
  if (mensagem.includes('JWT') || mensagem.includes('permission denied')) return 'Sua sessão expirou. Saia e entre de novo.';
  return mensagem;
}
