// Tela 11 - Cadastro de Paciente
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, escolherPaciente, avisoSucesso, mostrarErro, hojeISO, nomeCompletoValido } from '../comum.js';

await iniciarTela({ titulo: 'Cadastro de Paciente' });

const form = document.getElementById('form');
form.data_nasc.max = hojeISO(); // o calendário não deixa escolher data no futuro

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome = form.nome.value.trim().replace(/\s+/g, ' '); // "Maria   Silva" -> "Maria Silva"
  const nomeMae = form.nome_mae.value.trim().replace(/\s+/g, ' ');
  if (!nome) {
    form.nome.focus();
    return mostrarErro(form, 'Informe o nome completo.');
  }
  if (!nomeCompletoValido(nome)) {
    form.nome.focus();
    return mostrarErro(form, 'Nome do paciente: digite nome e sobrenome, só com letras.');
  }
  if (!form.data_nasc.value) {
    form.data_nasc.focus();
    return mostrarErro(form, 'Informe a data de nascimento.');
  }
  if (form.data_nasc.value > hojeISO()) return mostrarErro(form, 'A data de nascimento não pode ser no futuro.');
  if (form.data_nasc.value < '1900-01-01') return mostrarErro(form, 'Data de nascimento inválida.');
  if (nomeMae && !nomeCompletoValido(nomeMae)) {
    form.nome_mae.focus();
    return mostrarErro(form, 'Nome da mãe: digite nome e sobrenome, só com letras.');
  }

  // Campo opcional vazio vai como null (fica vazio no banco)
  const paciente = {
    nome: nome,
    data_nasc: form.data_nasc.value,
    leito: form.leito.value.trim() || null,
    nome_mae: nomeMae || null,
    setor: form.setor.value || null,
    estado_clinico: form.estado_clinico.value || null,
    diagnostico: form.diagnostico.value.trim() || null,
    alergias: form.alergias.value.trim() || null,
    info_sigilosa: form.info_sigilosa.value.trim() || null,
  };

  const botao = form.querySelector('button');
  botao.disabled = true;

  // Mesmo nome e mesmo nascimento = provavelmente o paciente já foi cadastrado
  const jaExiste = await supabase.from('pacientes').select('id')
    .eq('nome', paciente.nome)
    .eq('data_nasc', paciente.data_nasc);
  if (jaExiste.data && jaExiste.data.length > 0
    && !confirm('Já existe um paciente com esse nome e essa data de nascimento. Cadastrar mesmo assim?')) {
    botao.disabled = false;
    return;
  }

  // .select() no final = o banco devolve o paciente criado (precisamos do id dele)
  const { data, error } = await supabase.from('pacientes').insert(paciente).select();
  botao.disabled = false;
  if (error) return mostrarErro(form, traduzirErro(error));

  escolherPaciente(data[0].id); // o paciente novo já fica escolhido
  await avisoSucesso('Paciente cadastrado!');
  location.href = '/pages/paciente.html';
});
