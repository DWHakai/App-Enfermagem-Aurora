// Tela 4 - Paciente (ficha)
import { iniciarTela, nomesDaEquipe, calcularIdade, formatarData } from '../comum.js';

const { paciente } = await iniciarTela({ titulo: 'Paciente', precisaPaciente: true });
const nomes = await nomesDaEquipe();

function escrever(id, texto) {
  document.getElementById(id).textContent = texto;
}

const prontuario = String(paciente.id).padStart(6, '0');

escrever('nome', paciente.nome);
escrever('local', `Leito ${paciente.leito || '—'}`);
escrever('idade-prontuario', `${calcularIdade(paciente.data_nasc)} anos · Prontuário ${prontuario}`);

escrever('setor', paciente.setor || '—');
escrever('diagnostico', paciente.diagnostico || '—');
escrever('alergias', paciente.alergias || 'Nenhuma informada');
if (paciente.alergias) document.getElementById('alergias').classList.add('alerta');
escrever('estado', paciente.estado_clinico || '—');
escrever('admissao', formatarData(paciente.admissao));
escrever('cadastrado-por', nomes[paciente.autor_id] || '—');

if (paciente.nome_mae) escrever('mae', paciente.nome_mae);
else document.getElementById('linha-mae').hidden = true;

if (paciente.info_sigilosa) escrever('info-sigilosa', paciente.info_sigilosa);
else document.getElementById('sigilo').hidden = true;
