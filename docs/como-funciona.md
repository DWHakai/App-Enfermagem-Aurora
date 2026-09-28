# Como o app funciona

Guia para o grupo entender o código e conseguir explicar na apresentação.
Leia com o código aberto do lado: os links levam aos arquivos.

1. [Visão geral](#1-visão-geral)
2. [Onde fica cada coisa](#2-onde-fica-cada-coisa)
3. [import e export](#3-import-e-export)
4. [await e { data, error }](#4-await-e--data-error-)
5. [Uma tela do começo ao fim: Observações](#5-uma-tela-do-começo-ao-fim-observações)
6. [iniciarTela: o porteiro de toda tela](#6-iniciartela-o-porteiro-de-toda-tela)
7. [O paciente em atendimento](#7-o-paciente-em-atendimento)
8. [O banco de dados](#8-o-banco-de-dados)
9. [Segurança](#9-segurança)
10. [App instalável (PWA)](#10-app-instalável-pwa)
11. [Mudanças comuns: onde mexer](#11-mudanças-comuns-onde-mexer)
12. [Perguntas que a professora pode fazer](#12-perguntas-que-a-professora-pode-fazer)
13. [Glossário](#13-glossário)

---

## 1. Visão geral

```
Netlify ──(entrega HTML, CSS e JS)──▶ navegador do celular ──(lê e grava dados)──▶ Supabase
                                                                                  (login + banco)
```

- **Não existe um servidor nosso.** O Netlify só entrega os arquivos prontos, e o
  JavaScript que roda no celular conversa **direto** com o Supabase.
- O Supabase faz duas coisas: **login** (e-mail e senha) e **banco de dados** (PostgreSQL).
- Quem garante a segurança **não** é o JavaScript, porque qualquer pessoa pode ler e alterar
  o JS pelo navegador (F12). Quem garante é o **banco**, com as regras do
  [`01-estrutura.sql`](../banco-de-dados/01-estrutura.sql) (seção 9).

## 2. Onde fica cada coisa

Cada tela tem **dois arquivos com o mesmo nome**: o HTML (o esqueleto) e o JS (o que acontece).

| Arquivo | Papel |
|---|---|
| [`pages/observacoes.html`](../pages/observacoes.html) | Esqueleto da tela: campos, botões, a lista vazia |
| [`js/paginas/observacoes.js`](../js/paginas/observacoes.js) | Busca os dados, preenche a lista, salva o formulário |
| [`js/comum.js`](../js/comum.js) | Peças que todas as telas usam (cabeçalho, login, datas, avisos) |
| [`js/supabase.js`](../js/supabase.js) | A conexão com o banco, num lugar só |
| [`css/estilo.css`](../css/estilo.css) | O visual de todas as telas |

A pasta inteira:

```
greys-app/
├── index.html                   Tela 1  – Login
├── pages/
│   ├── criar-conta.html         Criar conta (cadastro da equipe)
│   ├── menu.html                Tela 2  – Menu (escolhe o paciente em atendimento)
│   ├── paciente.html            Tela 4  – Paciente (ficha)
│   ├── plantao.html             Telas 3 e 3b – Passagem de Plantão / Evolução (FUNCIONALIDADE PRINCIPAL)
│   ├── sinais-vitais.html       Tela 5  – Sinais Vitais
│   ├── medicacoes.html          Tela 6  – Medicações
│   ├── exames.html              Tela 7  – Exames
│   ├── historico.html           Tela 8  – Histórico (TELA DE ACOMPANHAMENTO)
│   ├── observacoes.html         Tela 9  – Observações
│   ├── perfil.html              Tela 10 – Perfil
│   ├── cadastro-paciente.html   Tela 11 – Cadastro de Paciente
│   └── setembro-amarelo.html    Setembro Amarelo (pública, abre sem login)
├── css/estilo.css               todo o visual (cores tiradas do Figma)
├── img/                         logo, laço, ícones e ícones do app
├── js/
│   ├── supabase.js              conexão com o banco + mensagens de erro em português
│   ├── comum.js                 peças usadas por todas as telas (cabeçalho, login, avisos, datas)
│   └── paginas/                 um arquivo por tela, com o mesmo nome do .html
│                                (o do index.html é o login.js)
├── banco-de-dados/
│   ├── 01-estrutura.sql         tabelas + regras de segurança
│   └── 02-dados-exemplo.sql     pacientes fictícios
├── docs/
│   ├── como-funciona.md         este guia
│   ├── publicar-e-testar.md     Supabase, Netlify, roteiro de teste, problemas comuns
│   ├── mudancas-figma.md        o que atualizar no Figma
│   └── requisitos-modelo.md     modelo do documento de requisitos
├── manifest.webmanifest         nome e ícones do app instalado
└── sw.js                        service worker (o que torna o site instalável)
```

O caminho de uma ação, do toque até o banco:

`pages/sinais-vitais.html` → `js/paginas/sinais-vitais.js` → `js/supabase.js` → Supabase

Regra prática para achar onde mexer:

- quer mudar um **texto fixo** ou um **campo**? HTML da tela;
- quer mudar **o que acontece** ao tocar em algo? JS da tela;
- quer mudar **cor, tamanho, espaçamento**? CSS.

## 3. import e export

### Como era no Xuxu Bank

```html
<script src="/scripts/auth.js"></script>
<script>
  function fazerLogin() { ... }
</script>
<button onclick="fazerLogin()">Entrar</button>
```

Um `<script>` comum deixa tudo o que declara **global**: qualquer outro script e o `onclick`
do HTML enxergam. Funciona em projeto pequeno, mas:

- olhando um arquivo, não dá para saber de onde veio uma função;
- se dois arquivos criam funções com o mesmo nome, a segunda apaga a primeira sem avisar;
- a ordem dos `<script>` importa.

### Como é aqui

```html
<script type="module" src="/js/paginas/observacoes.js"></script>
```

`type="module"` transforma o arquivo num **módulo**: nada nele é global.
O arquivo precisa dizer o que **usa** de outros arquivos (`import`),
e cada arquivo diz o que **oferece** (`export`):

```js
// js/comum.js
export function esc(texto) { ... }      // com export: as telas podem usar
function irPara(endereco) { ... }       // sem export: só o próprio comum.js usa
```

```js
// js/paginas/observacoes.js
import { supabase, traduzirErro } from '../supabase.js';
import { iniciarTela, esc } from '../comum.js';
```

Lendo o import: *"do arquivo `../comum.js`, quero `iniciarTela` e `esc`"*.
O nome entre chaves tem que ser **igual** ao do `export`.

O caminho `'../comum.js'` é relativo **ao arquivo que importa**: `observacoes.js` está em
`js/paginas/`, o `..` sobe para `js/`, então o arquivo é `js/comum.js`.

**O que ganhamos:**

1. Cada tela lista no topo tudo o que usa. No VS Code, Ctrl+clique num nome leva à função.
2. Várias telas têm uma função `mostrarLista`, e uma não atrapalha a outra.
3. A ordem não importa: o navegador baixa sozinho o `comum.js` e o `supabase.js` quando a tela pede.
4. Um arquivo importado por várias partes roda **uma vez só**. Por isso existe um único
   `supabase` (uma conexão) para o app todo.
5. O módulo só roda depois que o HTML terminou de carregar. Por isso não precisamos do
   `DOMContentLoaded` que o Xuxu Bank usa.
6. Permite `await` fora de função (seção 4).

**O que muda para quem programa:**

- **Precisa de servidor.** Aberto com duplo clique (`file://`), o navegador bloqueia módulos.
  Por isso o [publicar-e-testar.md](publicar-e-testar.md) manda usar o Live Server.
- **Não dá para usar `onclick="..."` no HTML**, porque as funções não são globais.
  No lugar, o JS "escuta" o elemento:
  ```js
  form.addEventListener('submit', async (evento) => { ... });
  ```
- **Um import com nome errado derruba a tela inteira** (fica em branco). O motivo aparece
  no Console (F12), por exemplo *"does not provide an export named ..."*.
- No Console do navegador as funções não existem soltas. Para testar uma, importe na hora:
  ```js
  const comum = await import('/js/comum.js');
  comum.formatarNumero(36.5);   // "36,5"
  ```

### Import de um endereço da internet

O [`js/supabase.js`](../js/supabase.js) começa assim:

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
```

É a biblioteca oficial do Supabase, baixada de um **CDN** (um site que hospeda bibliotecas),
parecido com o link do Font Awesome no Xuxu Bank: não precisa instalar nada.
O `@2.117.2` trava a versão, para ela não mudar sozinha no meio do trabalho.
Sem internet (ou com o CDN fora do ar) o app não abre, mas sem internet ele também não teria o banco.

## 4. await e { data, error }

O banco está na internet, então cada pergunta demora (milissegundos, ou segundos com internet ruim).
`await` quer dizer *"espere a resposta antes de ir para a próxima linha"*.

```js
const { data, error } = await supabase.from('observacoes').select('*').eq('paciente_id', paciente.id);
```

- `await` só funciona dentro de uma função `async` (como `async (evento) => { ... }`) ou no topo de um módulo.
- Toda resposta do Supabase é um objeto com duas partes: `data` (o resultado) e `error`
  (o problema, ou `null` se deu certo).
- `const { data, error } = ...` é **desestruturação**, um atalho para:
  ```js
  const resposta = await supabase.from('observacoes').select('*');
  const data = resposta.data;
  const error = resposta.error;
  ```
- O Supabase **não lança** erro: ele devolve o erro dentro de `error`. Por isso não usamos
  `try/catch`, e **toda chamada tem um `if (error)` logo depois**. Se escrever uma chamada
  nova, não esqueça dele.
- `traduzirErro(error)` ([`js/supabase.js`](../js/supabase.js)) troca a mensagem em inglês por
  uma em português ("E-mail ou senha incorretos.", "Essa dose já foi checada hoje."...).

As chamadas são SQL escrito em JavaScript:

| JavaScript (supabase-js) | SQL equivalente |
|---|---|
| `.from('observacoes').select('*')` | `select * from observacoes` |
| `.eq('paciente_id', 5)` | `where paciente_id = 5` |
| `.order('criado_em', { ascending: false })` | `order by criado_em desc` |
| `.limit(1)` | `limit 1` |
| `.insert({ paciente_id: 5, texto: 'Oi' })` | `insert into observacoes (paciente_id, texto) values (5, 'Oi')` |
| `.insert([linha1, linha2])` | um `insert` com as duas linhas: grava as duas ou nenhuma |
| `.update({ status: 'Disponível' }).eq('id', 3)` | `update exames set status = 'Disponível' where id = 3` |
| `.insert(...).select()` | o banco devolve a linha criada (usado para saber o id do paciente novo) |

Compare com o Xuxu Bank: lá os dados eram `JSON.parse(localStorage.getItem("usuarios"))`,
guardados só naquele navegador. A ideia aqui é a mesma (buscar uma lista, filtrar, mostrar),
mas os dados ficam num banco de verdade, que toda a equipe vê de qualquer aparelho.

## 5. Uma tela do começo ao fim: Observações

Abra [`pages/observacoes.html`](../pages/observacoes.html) e
[`js/paginas/observacoes.js`](../js/paginas/observacoes.js).

**O HTML** tem o formulário (`<form id="form">` com a `<textarea name="texto">`) e uma lista vazia
(`<ul id="lista">`). O `<body class="protegida">` deixa a tela invisível até o login ser conferido.

**O JS, na ordem em que roda:**

1. **Linha 8**: `await iniciarTela({ titulo: 'Observações', precisaPaciente: true })`.
   Confere o login, busca o paciente escolhido, desenha o cabeçalho e mostra a tela (seção 6).
   Devolve o `paciente`.
2. **Linha 9**: `mostrarPacienteAtual(paciente)` desenha a faixa "Maria Aparecida Silva · Leito 12 — trocar".
3. **Linha 13**: `nomesDaEquipe()` busca os nomes da equipe uma vez, para mostrar quem escreveu cada observação.
4. **Linhas 15 a 32**, `mostrarLista()`:
   - busca as observações **deste paciente**, das mais novas para as mais antigas;
   - se não tem nenhuma, mostra "Nenhuma observação ainda.";
   - senão, transforma cada linha do banco num `<li>` com `.map(...)` e junta tudo com `.join('')`;
   - o texto digitado passa por `esc()` antes de entrar no HTML (seção 9).
5. **Linhas 34 a 49**, o que acontece ao salvar:
   - `evento.preventDefault()` impede o formulário de recarregar a página (comportamento padrão do `<form>`);
   - confere se escreveu algo; se não, `mostrarErro` mostra a mensagem embaixo do formulário;
   - **trava o botão** (`disabled = true`) para um toque duplo não salvar duas vezes;
   - `insert` manda só `paciente_id` e `texto`. **Quem escreveu e quando o banco preenche sozinho**
     (`autor_id` e `criado_em` têm `default` no SQL);
   - destrava o botão; se deu erro, mostra; se deu certo, limpa o campo, mostra
     "Salvo com sucesso!" e espera o OK (`await avisoSucesso()`), depois recarrega a lista.
6. **Linha 51**: `await mostrarLista()` desenha a lista quando a tela abre.

Todas as outras telas seguem esse mesmo roteiro: `iniciarTela` → buscar e mostrar → escutar o formulário → gravar → avisar.

## 6. iniciarTela: o porteiro de toda tela

Em [`js/comum.js`](../js/comum.js), toda tela começa com:

```js
const { usuario, paciente } = await iniciarTela({ titulo: '...', precisaPaciente: true });
```

Ela faz, em ordem:

1. Confere se alguém está logado. Se não estiver (e a tela não for pública), vai para o login.
2. Se a tela é de um paciente, busca o paciente escolhido no Menu. Se não tem paciente escolhido
   (ou ele não existe mais), volta para o Menu com o seletor destacado (`menu.html?escolher=1`).
3. Desenha o cabeçalho (logo, marca, avatar) e o título com o botão voltar.
4. Mostra a tela (adiciona a classe `pronto` no `<body>`).

### Por que `irPara` devolve "uma promessa que nunca termina"?

```js
function irPara(endereco) {
  location.replace(endereco);
  return new Promise(() => {});
}
```

`location.replace(...)` pede para o navegador trocar de página, **mas não para o JavaScript**:
as linhas seguintes continuam rodando até a página nova chegar. Sem login, a tela seguiria em frente
e tentaria usar `paciente.nome` de um paciente que não existe (erro no console e a tela piscando).

`new Promise(() => {})` é uma promessa que nunca termina. Como a tela fez `await iniciarTela(...)`,
ela fica esperando para sempre, e **nada depois dessa linha roda**. Enquanto isso, o navegador troca de página.
É um truque, mas deixa todas as telas simples: nenhuma precisa de `if (!usuario) return`.

### Por que a tela não "pisca" antes de conferir o login?

As telas que exigem login têm `<body class="protegida">`, e o CSS esconde o conteúdo até o
`iniciarTela` colocar a classe `pronto`:

```css
body.protegida:not(.pronto) .app { visibility: hidden; }
```

Login, Criar conta e Setembro Amarelo não têm `protegida`: abrem sem login.

## 7. O paciente em atendimento

O Menu tem o seletor **"Paciente em atendimento"**. A escolha fica guardada no navegador
(`localStorage`, chave `greys_paciente`) e toda tela de paciente lê de lá
(`pacienteEscolhido()` / `escolherPaciente(id)` no [`js/comum.js`](../js/comum.js)).

- Só o **número (id)** do paciente fica no navegador. Os dados vêm sempre do banco.
- A faixa "Maria... Leito 12 — trocar" no topo de cada tela leva de volta ao Menu para trocar.
- Cadastrar um paciente novo já deixa ele escolhido.
- **Sair** apaga a escolha.

Comparando: o Xuxu Bank guardava a lista de usuários **com as senhas** no `localStorage`.
Aqui nenhuma senha fica no navegador nem no nosso banco: o Supabase guarda a senha com **hash**
(embaralhada de um jeito que não dá para desfazer) numa tabela interna dele, a `auth.users`.
O navegador guarda só uma "sessão" (um crachá temporário que o Supabase renova sozinho).

## 8. O banco de dados

Arquivo: [`banco-de-dados/01-estrutura.sql`](../banco-de-dados/01-estrutura.sql).

| Tabela | O que guarda | Telas que usam |
|---|---|---|
| `perfis` | Nome, função, setor, plantão de quem usa o app | Criar conta, Perfil, "quem registrou" |
| `pacientes` | Dados do paciente | Cadastro, Menu (seletor), Ficha |
| `registros_plantao` | Passagens de plantão e evoluções (`tipo`) | Plantão, Histórico |
| `sinais_vitais` | Cada aferição (só o que foi medido) | Sinais Vitais, Histórico |
| `medicacoes` | A prescrição transcrita, **um horário por linha** | Medicações |
| `administracoes` | Cada dose checada | Medicações, Histórico |
| `exames` | Exames e o status | Exames, Histórico |
| `observacoes` | Observações livres | Observações, Histórico |

Colunas que se repetem:

- `id bigint generated always as identity`: o banco numera sozinho (1, 2, 3...). Na ficha, o
  prontuário é esse número com zeros na frente (`000007`).
- `paciente_id ... references pacientes(id)`: liga o registro ao paciente. O banco não aceita
  um `paciente_id` que não existe. O `on delete cascade` só importa se alguém apagar um
  paciente pelo painel do Supabase: os registros dele vão junto.
- `autor_id uuid default auth.uid()`: **quem registrou**. `auth.uid()` é o id de quem está logado,
  e o banco preenche sozinho. As regras de segurança não aceitam o nome de outra pessoa (seção 9).
- `criado_em timestamptz default now()`: quando foi gravado, pelo relógio do servidor.

**Regras que o próprio banco garante**, mesmo que alguém mexa no JavaScript:

| Regra | Onde |
|---|---|
| Estado clínico só pode ser um dos 4 da lista | `check (estado_clinico in (...))` |
| Passagem, evolução e observação não podem ser vazias | `check (trim(texto) <> '')` |
| Sinais: valores possíveis (ex.: SpO₂ de 50 a 100) | `check (spo2 between 50 and 100)` |
| Sinais: pelo menos um preenchido | `check (num_nonnulls(...) > 0)` |
| Pressão sempre em par, diastólica menor que a sistólica | dois `check` no fim da tabela |
| A mesma dose não é checada duas vezes no dia (nem por outra pessoa) | `unique (medicacao_id, dia)` |
| Status do exame só Pendente, Em análise ou Disponível | `check (status in (...))` |

**Por que validar duas vezes (na tela e no banco)?** A tela valida para dar uma mensagem clara
na hora ("Preencha pelo menos um sinal."). O banco valida porque o JavaScript roda no aparelho
da pessoa e pode ser burlado: **o banco é a última palavra**.

**O gatilho (trigger) `criar_perfil`**: quando alguém cria uma conta, o Supabase grava o e-mail e a senha
na tabela interna dele (`auth.users`). O gatilho copia nome, função, setor e plantão
(que o formulário mandou em `options.data`) para a nossa tabela `perfis`.
Ele tem `security definer` (roda com a permissão do dono do banco) porque quem grava a conta nova
é o sistema de login do Supabase, e não a pessoa.

## 9. Segurança

### Quem pode o quê

| Quem | Ler | Registrar | Alterar | Apagar |
|---|---|---|---|---|
| Sem login | nada | nada | nada | nada |
| Equipe logada | tudo | sim, **só no próprio nome** | só o **status do exame** | nada |

Isso está em dois lugares do `01-estrutura.sql`:

1. **Permissões** (`revoke` / `grant`): o Supabase vem liberando tudo, até apagar. O script tira tudo
   e devolve só `select` (ler) e `insert` (registrar), mais `update` **só na coluna `status`** de `exames`.
2. **RLS (Row Level Security)**: regras que o banco confere **linha por linha**:
   - `"equipe le"`: quem está logado lê todas as linhas;
   - `"registra no proprio nome"`: só grava se `autor_id = auth.uid()`, ou seja, ninguém registra
     em nome de outra pessoa (nem mandando outro `autor_id` pelo console);
   - `"muda o status"`: qualquer pessoa da equipe muda o status de qualquer exame.

Por que ninguém edita nem apaga? Como no prontuário de papel, o que foi registrado fica registrado:
se alguém errou, faz um registro novo. (Confirmar com a Enfermagem como elas corrigem um registro:
é uma boa pergunta para a entrevista.)

### A chave no código não é perigosa?

A **Publishable key** (`sb_publishable_...`) é feita para ficar no navegador: ela é como o
**endereço do prédio**. Quem decide quem entra é o **porteiro** (as regras acima), e ele pede o
**crachá** (o login). Sem login, a chave não lê nem grava nada.

A **secret key** (`sb_secret_...`, a antiga `service_role`) é a chave mestra: passa por cima de
todas as regras. **Nunca** coloque no código nem mande para o GitHub.

### O cadastro de conta é aberto. E daí?

Qualquer pessoa com o link consegue criar uma conta e, logada, ver todos os pacientes.
Deixamos assim de propósito: a professora e a turma precisam conseguir criar conta e testar.
É por isso que **todos os dados são fictícios**. Num hospital de verdade, a conta seria criada
pela coordenação. No Supabase, isso seria: **Authentication → Sign In / Providers →**
desligar **Allow new users to sign up**, e criar as contas em **Authentication → Users → Add user**.

### Texto digitado não vira código (XSS)

Se alguém digitar numa observação:

```html
<img src="x" onerror="alert('invadido')">
```

e o app colocasse isso direto no `innerHTML`, o navegador criaria a imagem e rodaria o código
em todo aparelho que abrisse a tela. Para evitar:

- quando montamos HTML com texto do banco, o texto passa por `esc()`, que troca `<` por `&lt;` etc.
  O navegador mostra o texto em vez de executar;
- quando é um campo só, usamos `textContent` (como na ficha do paciente), que nunca vira HTML.

**Regra:** texto que veio do banco ou de um campo **nunca** entra num `innerHTML` sem `esc()`.

## 10. App instalável (PWA)

PWA (Progressive Web App) é um site que o celular trata como app: ícone na tela inicial,
abre sem a barra do navegador. Três peças:

1. [`manifest.webmanifest`](../manifest.webmanifest): nome, ícones e cores do app instalado.
   `"display": "standalone"` = abre sem a barra do navegador.
2. [`sw.js`](../sw.js), o **service worker**: um script que fica entre o app e a internet.
   O nosso usa **"rede primeiro"**: sempre busca a versão mais nova do arquivo e guarda uma cópia;
   sem internet, usa a cópia. Os dados do Supabase **não** passam por ele.
   (O do Xuxu Bank usava uma lista fixa de arquivos para guardar. O nosso guarda o que for sendo
   aberto, então não precisa manter uma lista.)
3. **HTTPS**, que o Netlify já dá.

**Sem internet:** as telas já visitadas abrem, mas não dá para ler nem gravar dados.
Aparece "Sem conexão com o servidor. Verifique a internet."

## 11. Mudanças comuns: onde mexer

| Quero... | Onde |
|---|---|
| Trocar um texto fixo de uma tela | O `.html` da tela, em `pages/` |
| Trocar o texto do Setembro Amarelo | [`pages/setembro-amarelo.html`](../pages/setembro-amarelo.html) |
| Acrescentar um setor na lista | [`pages/cadastro-paciente.html`](../pages/cadastro-paciente.html), no `<select name="setor">`. Setor não tem regra no banco, então só o HTML |
| Mudar quando um sinal aparece "alterado" | `normalMin` / `normalMax` no objeto `SINAIS` de [`js/paginas/sinais-vitais.js`](../js/paginas/sinais-vitais.js) |
| Mudar uma cor | [`css/estilo.css`](../css/estilo.css): as cores ficam no começo, em `:root` |

**Acrescentar um estado clínico** precisa mexer em **dois** lugares, senão o banco recusa com
"Algum valor está fora do permitido":

1. o `<select name="estado_clinico">` do `cadastro-paciente.html`;
2. a regra do banco. No Supabase (SQL Editor), rode:
   ```sql
   alter table pacientes drop constraint pacientes_estado_clinico_check;
   alter table pacientes add constraint pacientes_estado_clinico_check
     check (estado_clinico in ('Estável', 'Em observação', 'Grave', 'Crítico', 'Novo estado'));
   ```
   e atualize a mesma lista no `01-estrutura.sql`, para o arquivo continuar igual ao banco.

**Acrescentar um campo novo no paciente** (ex.: peso) mexe em quatro lugares:

1. banco: `alter table pacientes add column peso numeric;` (e o mesmo no `01-estrutura.sql`);
2. `cadastro-paciente.html`: o `<input name="peso">`;
3. `js/paginas/cadastro-paciente.js`: `peso: form.peso.value || null` no objeto `paciente`;
4. ficha: uma linha nova em `pages/paciente.html` e um `escrever('peso', ...)` em `js/paginas/paciente.js`.

**Depois de mudar arquivos:** no computador, recarregue a página. No celular com o app instalado,
feche e abra o app (o service worker busca a versão nova quando há internet).

## 12. Perguntas que a professora pode fazer

**Onde ficam os dados?**
No Supabase, um banco PostgreSQL na nuvem (região São Paulo). O app no celular lê e grava direto nele.

**Por que não guardar no `localStorage`?**
O `localStorage` fica só naquele navegador: a técnica do plantão da noite não veria o que a do dia registrou.
E guardaria senhas sem proteção.

**Como o sistema sabe quem fez cada registro?**
O banco preenche `autor_id` com quem está logado (`default auth.uid()`), e uma regra (RLS) recusa
qualquer registro no nome de outra pessoa.

**E se duas pessoas checarem a mesma dose?**
A segunda recebe "Essa dose já foi checada hoje." O banco tem `unique (medicacao_id, dia)`,
então isso vale mesmo que as duas toquem ao mesmo tempo.

**Por que não dá para apagar ou editar?**
Registro de prontuário não se apaga: se errou, registra de novo. O banco só deixa ler e registrar,
e a única alteração possível é o status do exame.

**Por que qualquer pessoa pode criar conta?**
Para a turma e a professora testarem. Por isso os dados são fictícios. Num hospital real,
a criação de contas seria desligada e feita pela coordenação.

**A chave do Supabase aparece no código. Não é falha de segurança?**
Não. É a chave pública (publishable), feita para o navegador. Sem login ela não acessa nada.
A chave secreta não está no projeto.

**Qual é a funcionalidade principal? E a tela de acompanhamento?**
Principal: **Passagem de Plantão / Evolução** (`plantao.html`). Acompanhamento: o **Histórico**
(`historico.html`), que junta tudo o que foi registrado do paciente numa linha do tempo.

**Funciona sem internet?**
As telas já visitadas abrem, mas os dados precisam de internet. Aparece um aviso de "Sem conexão".

**Por que o sinal vital não precisa estar todo preenchido?**
Na prática nem sempre se afere tudo no mesmo horário. Salva o que foi medido, e o que não foi
aparece como "—". A pressão é a exceção: vai sempre completa (sistólica e diastólica).

**Vocês usaram IA?**
Resposta sugerida: sim, como apoio, e o grupo revisou e testou cada tela
(ver o roteiro de teste em [publicar-e-testar.md](publicar-e-testar.md)).

## 13. Glossário

| Termo | O que é |
|---|---|
| **CDN** | Site que hospeda bibliotecas prontas para usar direto pelo link |
| **Módulo** | Arquivo JS com `import`/`export`, carregado com `<script type="module">` |
| **async / await** | Jeito de escrever código que espera uma resposta (do banco) sem travar a tela |
| **Desestruturação** | `const { data, error } = objeto`: tira as partes de um objeto em variáveis |
| **Supabase** | Serviço que dá banco PostgreSQL + login prontos, com plano grátis |
| **Publishable key** | Chave pública do Supabase, feita para ficar no navegador |
| **RLS** | Row Level Security: regras que o banco confere linha por linha |
| **Trigger (gatilho)** | Código do banco que roda sozinho quando algo acontece (ex.: conta criada) |
| **check / unique** | Regras de uma tabela: "valor tem que estar na faixa" / "não pode repetir" |
| **XSS** | Ataque em que um texto digitado vira código na tela de outra pessoa |
| **PWA** | Site que pode ser instalado como app |
| **Service worker** | Script que fica entre o app e a internet (guarda cópias para abrir sem rede) |
| **Netlify** | Serviço que publica o site na internet, com HTTPS |
