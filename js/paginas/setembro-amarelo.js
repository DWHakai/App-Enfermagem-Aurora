// Setembro Amarelo: o conteúdo está todo no HTML; aqui só monta o cabeçalho.
// Página pública (publica: true): abre mesmo sem login, para pacientes e familiares.
// O botão voltar leva ao menu; quem não entrou é mandado de lá para o login.
import { iniciarTela } from '../comum.js';

await iniciarTela({ titulo: 'Setembro Amarelo', publica: true });
