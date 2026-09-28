// Tela 2 - Menu
import { iniciarTela, listarPacientes, opcoesDePacientes, pacienteEscolhido, escolherPaciente } from '../comum.js';

await iniciarTela();

const seletor = document.getElementById('seletor');
const select = document.getElementById('paciente');
const cartoes = document.querySelectorAll('.cartao');

const pacientes = await listarPacientes();
select.insertAdjacentHTML('beforeend', opcoesDePacientes(pacientes));
if (pacientes.length === 0) select.options[0].textContent = 'Nenhum paciente: cadastre abaixo';

const escolhido = pacienteEscolhido();
if (pacientes.some((p) => String(p.id) === escolhido)) select.value = escolhido;
else escolherPaciente(null);

// sem paciente, os cartões ficam apagados
function atualizarCartoes() {
  for (const cartao of cartoes) {
    cartao.classList.toggle('desativado', !select.value);
  }
}

function pedirPaciente() {
  seletor.classList.add('destaque');
  select.focus();
}

select.addEventListener('change', () => {
  escolherPaciente(select.value);
  seletor.classList.remove('destaque');
  atualizarCartoes();
});

for (const cartao of cartoes) {
  cartao.addEventListener('click', (evento) => {
    if (!select.value) {
      evento.preventDefault();
      pedirPaciente();
    }
  });
}

atualizarCartoes();

// veio de uma tela que precisava de paciente
if (location.search.includes('escolher')) pedirPaciente();
