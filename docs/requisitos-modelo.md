# Documento de Requisitos — Grey's Anatomy Hospital

> **Isto é um MODELO.** O documento vale 20% da nota ("Coleta, análise e documentação dos requisitos"),
> e a investigação do problema vale outros 10%. Ele precisa conter **o que a Enfermagem disse**, e não
> o que o grupo imagina.
>
> **Como usar:**
>
> 1. Levem as perguntas da seção 4 para a conversa e anotem as respostas **com as palavras delas**.
> 2. Não parem na primeira resposta. Perguntem "por quê?", "sempre é assim?", "e quando dá errado?".
>    A professora pede isso explicitamente.
> 3. Depois, preencham as seções 1 a 3 e ajustem os requisitos (seções 5 a 8) ao que foi dito.
>    O que estiver marcado **(confirmar)** é uma suposição do grupo: perguntem e corrijam.
> 4. Para entregar, passem para o Word ou Google Docs e salvem em PDF. Apaguem este quadro.

---

## 1. Identificação

| | |
|---|---|
| Turma | ____ |
| Professora | Francielle Barros |
| Grupo (até 5 pessoas) | ____, ____, ____, ____, ____ |
| Parceiras(os) da Enfermagem | ____, ____ |
| Conversas | 24/09 coleta de requisitos · 28/09 validação do Figma · 30/09 teste do sistema · 02/10 feedback final |
| Sistema publicado | https://____.netlify.app |
| Protótipo no Figma | ____ |

## 2. O problema

**Contexto** (como a Enfermagem descreveu):
____

**Problema a resolver:**
____

> Suposição do grupo (confirmar): a troca de plantão e os registros de enfermagem dependem de papel
> e de conversa, e informações importantes (alergias, doses já dadas, exames pendentes) se perdem
> de um turno para o outro.

**Como funciona hoje** (passo a passo, do jeito que contaram):
____

**Quem vai usar:** enfermeiras(os), técnicas(os) de enfermagem e estudantes de enfermagem **(confirmar)**.
Médicos ficam de fora: o app é só da equipe de enfermagem (decisão do grupo, explicar o motivo).

**Objetivo do sistema:** ____

## 3. Registro da entrevista

| Pergunta | Resposta (palavras delas) | O que virou no sistema |
|---|---|---|
| | | |
| | | |
| | | |

## 4. Perguntas para a Enfermagem

### 4.1 Sobre o processo

Organizadas pelos 10 pontos que o TP pede para investigar.

1. **Quem utilizará o sistema?**
   - Quem faz os registros no plantão: enfermeira, técnica, estudante? Todos podem registrar tudo?
   - Estudante registra sozinho ou com supervisão?
2. **Qual problema precisa ser resolvido?**
   - O que mais dá errado hoje na troca de plantão?
   - Já aconteceu de uma dose ser dada duas vezes, ou esquecida? Como descobriram?
3. **Como o processo funciona atualmente?**
   - Como é feita a passagem de plantão hoje (papel, livro, conversa)? Quanto tempo leva?
   - Onde fica a prescrição? Como a medicação é "checada" no papel?
   - Como é a evolução de enfermagem hoje? Quem escreve, quando e onde?
4. **Quais informações precisam ser registradas?**
   - O que não pode faltar numa passagem de plantão? E numa evolução?
   - Quais sinais vitais são aferidos, e com que frequência?
5. **Quais informações precisam ser consultadas?**
   - Ao assumir um paciente, o que precisa ver primeiro?
   - O que costuma ser procurado e não é encontrado?
6. **Quais ações o usuário precisa realizar?**
   - Quem cadastra o paciente na admissão?
   - A enfermagem solicita exames ou só acompanha o resultado?
7. **Quais regras precisam ser respeitadas?**
   - Um registro pode ser corrigido ou apagado? Como se corrige um erro no prontuário?
   - Quem pode ver informações sigilosas do paciente?
   - A checagem da dose precisa do horário exato em que foi dada?
8. **Quais situações podem ocorrer durante o uso?**
   - Paciente troca de leito, tem alta, é transferido ou vai a óbito: o que precisa ser registrado?
   - Medicação suspensa, dose recusada pelo paciente: como fica registrado hoje?
   - O que fazer se a internet cair no meio do plantão?
9. **Quais informações são obrigatórias?**
   - No cadastro do paciente, o que é obrigatório? (O app exige nome e data de nascimento.)
   - Na evolução: data, hora, nome e função de quem escreveu?
10. **Quais informações precisam ser apresentadas ao usuário?**
    - O que precisa aparecer em destaque? (O app destaca alergias e sinais vitais alterados.)
    - A partir de que valores um sinal vital é considerado alterado? (ver RN08)

### 4.2 Sobre o Setembro Amarelo

Mostrem a página do app (`pages/setembro-amarelo.html`) e perguntem os pontos do TP:

1. **Quais informações são relevantes?** Hoje a página tem: CVV 188, onde buscar ajuda (UBS, CAPS,
   SAMU 192), sinais de alerta e uma parte sobre a saúde mental da equipe. Falta ou sobra algo?
2. **Qual é o público?** O grupo escolheu **pacientes e familiares (confirmar)**. A parte da equipe deve ficar?
3. **Qual linguagem é adequada?** O grupo escolheu **acolhedora e simples (confirmar)**.
4. **Quais informações devem ser evitadas?** O texto segue as recomendações da OMS
   (não citar métodos, sem tom sensacionalista, sempre indicar onde buscar ajuda).
   Há mais alguma coisa que não deve aparecer?
5. **Quais fontes devem ser utilizadas?** Hoje: CVV, Ministério da Saúde e OPAS/OMS.
6. **Qual objetivo o conteúdo deve cumprir?** ____
7. **Onde o conteúdo deve aparecer?** Hoje: banner no Menu e uma página própria, que abre sem login
   (dá para mandar o link ou transformar em QR code no card do Setembro Amarelo).
8. **Quem validou o texto, e quando?** (nomes para colocar no fim da página)

### 4.3 Validação do protótipo (28/09)

Os 8 pontos que o TP pede para as usuárias avaliarem:

| Pergunta | Resposta | Ajuste feito |
|---|---|---|
| A solução atende ao processo apresentado? | | |
| As informações necessárias estão presentes? | | |
| O fluxo faz sentido? | | |
| As telas são compreensíveis? | | |
| Falta alguma informação? | | |
| Alguma informação é desnecessária? | | |
| O conteúdo do Setembro Amarelo está adequado? | | |
| A solução representa a necessidade apresentada? | | |

## 5. Requisitos funcionais

O que o sistema faz hoje. Ajustem com o que a Enfermagem pedir.

| Código | Requisito | Tela | Situação |
|---|---|---|---|
| RF01 | Entrar com e-mail e senha | Login | Feito |
| RF02 | Criar conta da equipe: nome, e-mail, senha, função, setor e plantão (sem COREN: o app é da equipe técnica de enfermagem) | Criar conta | Feito |
| RF03 | Escolher o paciente em atendimento | Menu | Feito |
| RF04 | Cadastrar paciente: nome e nascimento obrigatórios; leito, nome da mãe, setor, estado clínico, diagnóstico, alergias e informação sigilosa opcionais | Cadastro de Paciente | Feito |
| RF05 | Ver a ficha do paciente, com alergias em destaque e a informação sigilosa recolhida até um toque | Paciente | Feito |
| RF06 | **Registrar passagem de plantão e evolução de enfermagem, com data e hora (FUNCIONALIDADE PRINCIPAL)** | Plantão | Feito |
| RF07 | Registrar sinais vitais (pelo menos um) e destacar os valores alterados | Sinais Vitais | Feito |
| RF08 | Transcrever a prescrição (um horário por linha) e checar as doses dadas no dia | Medicações | Feito |
| RF09 | Solicitar exame e acompanhar o status: Pendente, Em análise, Disponível | Exames | Feito |
| RF10 | Registrar observações livres sobre o paciente | Observações | Feito |
| RF11 | **Ver tudo o que foi registrado do paciente numa linha do tempo, com quem fez (TELA DE ACOMPANHAMENTO)** | Histórico | Feito |
| RF12 | Ver o próprio perfil e sair | Perfil | Feito |
| RF13 | Conteúdo do Setembro Amarelo pelo Menu e por um link público | Setembro Amarelo | Feito (texto a validar) |
| RF14 | Instalar o sistema como app no celular | Perfil → Configurações | Feito |

## 6. Requisitos não funcionais

| Código | Requisito |
|---|---|
| RNF01 | Funciona no navegador do celular e pode ser instalado como app (PWA) |
| RNF02 | Publicado na internet, com HTTPS (Netlify) |
| RNF03 | Dados salvos num banco de dados de verdade (Supabase/PostgreSQL), com persistência |
| RNF04 | Só a equipe logada acessa os dados; as regras de acesso ficam no banco |
| RNF05 | Usa apenas dados fictícios (o sistema é público para testes) |
| RNF06 | Visual fiel ao protótipo do Figma (cores, fontes e ícones) |
| RNF07 | Textos em português, com linguagem simples |
| RNF08 | Campos com rótulo, mensagens de erro claras e botões com área de toque grande |

## 7. Regras de negócio

| Código | Regra |
|---|---|
| RN01 | A mesma dose não pode ser checada duas vezes no mesmo dia, nem por pessoas diferentes |
| RN02 | Sinais vitais: pelo menos um valor; pressão sempre completa; diastólica menor que a sistólica; valores dentro de faixas possíveis |
| RN03 | Passagem e evolução não podem ficar vazias nem ter data/hora no futuro |
| RN04 | Nome e data de nascimento do paciente são obrigatórios; o nascimento não pode estar no futuro |
| RN05 | Nenhum registro é editado ou apagado; a única alteração é o status do exame **(confirmar como a Enfermagem corrige um erro)** |
| RN06 | Todo registro guarda automaticamente quem fez e quando |
| RN07 | Estado clínico: Estável, Em observação, Grave ou Crítico **(confirmar a lista)** |
| RN08 | Sinal "alterado" fora destas faixas: PA 90–139 / 60–89 mmHg, FC 60–100 bpm, temperatura 35,5–37,7 °C, SpO₂ 94–100%, FR 12–20 irpm, dor 0–6 **(confirmar com a Enfermagem)** |
| RN09 | Medicação com mais de um horário (ex.: 12/12h) é cadastrada uma vez para cada horário |

## 8. Fora do escopo

O que o sistema **não** faz, e por quê:

- **Funções de médico** (prescrever, cadastro de médico): o app é só da equipe de enfermagem.
- **Editar ou apagar registros**: o registro fica como foi feito (ver RN05).
- **Alta, transferência e óbito**: **(confirmar se é necessário)**.
- **Resultado do exame**: o app acompanha só o status.
- **Avisos de horário de medicação**.
- **Uso sem internet**: as telas abrem, mas os dados precisam de conexão.
- **Restringir quem vê a informação sigilosa**: toda a equipe logada vê; ela só fica recolhida na ficha.

## 9. Teste com a Enfermagem (30/09): roteiro de observação

Peçam para elas fazerem as tarefas **sem ajuda** e anotem onde travaram.

| Tarefa | Conseguiu? (sim / com ajuda / não) | Onde travou | Observação |
|---|---|---|---|
| Criar a própria conta | | | |
| Escolher a paciente Maria | | | |
| Registrar uma passagem de plantão e uma evolução | | | |
| Registrar sinais vitais | | | |
| Checar a medicação das 08:00 | | | |
| Encontrar no Histórico o que registrou | | | |
| Encontrar o conteúdo do Setembro Amarelo | | | |

O que observar (lista do TP):

- [ ] dificuldades de navegação
- [ ] informações ausentes
- [ ] informações desnecessárias
- [ ] problemas de compreensão
- [ ] problemas no fluxo
- [ ] problemas visuais
- [ ] problemas de interação
- [ ] diferenças entre o que foi pedido e o que foi feito

## 10. Registro de feedbacks e melhorias

Ciclo que a professora quer ver: Requisitos → Protótipo → Validação → Desenvolvimento → Teste → Melhorias.

| Data | Quem deu o feedback | Feedback | Ajuste feito (Figma e/ou sistema) | Situação |
|---|---|---|---|---|
| 28/09 | | | | |
| 30/09 | | | | |
| 02/10 | | | | |
