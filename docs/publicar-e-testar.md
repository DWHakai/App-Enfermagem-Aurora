# Publicar e testar

Passo a passo para colocar o app no ar e conferir se tudo funciona.
Para entender o código, veja [como-funciona.md](como-funciona.md).

## 1. Criar o banco de dados (Supabase), do zero

1. Entre em https://supabase.com e clique em **Start your project**.
   Faça login com o **GitHub** (é o jeito mais rápido).
2. Crie a organização no plano **Free** e depois clique em **New project**:
   - **Name:** `greys-app`
   - **Database Password:** clique em *Generate a password* e guarde num lugar seguro.
     Ela **não** vai no código.
   - **Region:** South America (São Paulo)
   - Clique em **Create new project** e espere uns 2 minutos.
3. No menu da esquerda, abra **SQL Editor** (ícone `>_`). O editor já abre numa aba vazia;
   para abrir outra, use o **+** ao lado de "Search queries" → **Create a new snippet**.
   - Cole **todo** o arquivo `banco-de-dados/01-estrutura.sql` e clique em **Run** (Ctrl+Enter).
     Se aparecer um aviso de "destructive operation", confirme: são só os `drop policy if exists`,
     que apagam regras antigas para recriar. Nenhum dado é apagado.
     Deve aparecer *Success. No rows returned*.
   - Faça o mesmo com `banco-de-dados/02-dados-exemplo.sql`, **uma vez só**
     (rodar de novo duplica os pacientes de exemplo).
4. Vá em **Authentication → Sign In / Providers → Email**, desligue **Confirm email** e salve.
   Sem isso, cada conta nova precisaria confirmar por e-mail, e o plano grátis envia poucos e-mails por hora.
5. Clique no botão **Connect**, no topo da página do projeto, e copie:
   - a **Project URL** (`https://xxxxxxxx.supabase.co`);
   - a **Publishable key** (`sb_publishable_...`).

   Os dois também ficam em **Project Settings → API Keys**.
6. Cole os dois no começo do arquivo `js/supabase.js`:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_CHAVE = 'sb_publishable_...';
   ```
7. Teste (seção 2): crie uma conta no app e confira em **Table Editor → perfis** que ela apareceu.

> **Pode colocar a Publishable key no código?** Pode. Ela é feita para ficar no navegador.
> Quem protege os dados são as regras do `01-estrutura.sql`: sem login, ninguém lê nem grava nada.
> **Nunca** coloque no projeto a **secret key** (`sb_secret_...`), a antiga **service_role**
> nem a senha do banco.

> **Antes de cada apresentação:** no plano grátis, o projeto **pausa depois de uma semana sem uso**.
> Abra o painel do Supabase no dia anterior; se estiver pausado, clique em **Restore project**.

## 2. Rodar no seu computador

As telas usam módulos JavaScript (`import`) e caminhos que começam com `/`. Por isso:

- **não funciona abrir o `.html` com duplo clique**: precisa de um servidor local;
- **o servidor precisa usar a pasta `greys-app` como raiz**.

Escolha uma opção:

- **VS Code:** abra a pasta `greys-app` (e não a pasta acima dela). Instale a extensão *Live Server*,
  clique com o botão direito no `index.html` e escolha **Open with Live Server**.
- **Python:** dentro da pasta `greys-app`, rode o comando abaixo e abra http://localhost:5173

```bash
python -m http.server 5173
```

Enquanto o `js/supabase.js` estiver sem URL e chave, o app mostra um aviso e não abre.

## 3. Publicar (Netlify)

**Jeito recomendado: GitHub + Netlify** (o site atualiza sozinho a cada `git push`)

1. Envie esta pasta para um repositório no GitHub.
2. Em https://app.netlify.com clique em **Add new project → Import an existing project → GitHub**
   e escolha o repositório.
3. Na tela de configuração, deixe **Build command** e **Publish directory** vazios
   (o site não tem etapa de build: publica a pasta como está). Clique em **Deploy**.
4. O Netlify gera um link como `https://nome-aleatorio.netlify.app`. Para trocar o nome:
   **Project configuration → Change project name**.

**Jeito rápido, sem GitHub:** abra https://app.netlify.com/drop e arraste a pasta `greys-app` inteira.
Para atualizar, arraste de novo.

Depois de publicar, teste o link no celular **e** no computador.

## 4. Instalar no celular

Abra o link publicado no celular:

- **Android (Chrome):** toque nos três pontinhos e em **Instalar app**.
- **iPhone (Safari):** toque em **Compartilhar** e em **Adicionar à Tela de Início**.

## 5. Conferir se tudo funciona (antes de apresentar)

Faça com o Supabase de verdade, de preferência no celular e com **duas contas** (duas pessoas do grupo).
Se algo não bater, veja a seção 6.

**Conta e login**

- [ ] Abrir o link sem estar logado: aparece o Login.
- [ ] Criar uma conta: entra direto no Menu.
- [ ] Senha fraca (ex.: 123456) ou nome sem sobrenome: o app recusa e diz o motivo.
      No Supabase, **Table Editor → perfis** mostra as duas com função, setor e plantão.
- [ ] Senha errada: "E-mail ou senha incorretos."
- [ ] Perfil → Sair, e entrar de novo com a mesma conta.

**Menu e paciente**

- [ ] Tocar num cartão sem escolher paciente: o seletor fica destacado e nada abre.
- [ ] Escolher a Maria: os cartões acendem. Na ficha, a alergia aparece em destaque e a
      informação sigilosa fica fechada até um toque.
- [ ] "+ Paciente" sem nome, ou com nascimento no futuro: recusado. Com os dados certos:
      abre a ficha do paciente novo, com "Cadastrado por" = você.

**Funcionalidade principal (Plantão)**

- [ ] Passagem + evolução juntas: "Salvo com sucesso!" e as duas aparecem no Histórico.
- [ ] Data ou hora no futuro: recusado.
- [ ] Aba Evolução: salva só a evolução.

**Sinais, medicações, exames, observações e histórico**

- [ ] Sinais: salvar só FC 112 e temperatura: o resto aparece "—" e a FC fica destacada.
- [ ] Sinais: só a sistólica, ou diastólica maior que a sistólica: recusado.
- [ ] Medicações: marcar duas e tocar em "Checar medicação": elas ficam travadas.
      Na **outra conta**, no mesmo paciente, as duas já aparecem checadas.
- [ ] Exames: tocar no status passa de Pendente para Em análise e depois Disponível.
      "Solicitar exame" com um nome: o exame novo aparece primeiro.
- [ ] Observações: escrever `<b>teste</b>`: aparece o texto do jeito que foi digitado, sem negrito.
- [ ] Histórico: tudo o que foi feito aparece, do mais novo para o mais antigo, com o nome de quem fez.

**Outros**

- [ ] Banner do Setembro Amarelo no Menu: abre a página. No celular, "Ligar 188" abre o discador
      (não precisa completar a ligação).
- [ ] Instalar o app no celular (seção 4) e abrir pelo ícone.
- [ ] Abrir no computador: a tela fica centralizada e nada quebra.

## 6. Se algo der errado

| O que aparece | Causa provável | O que fazer |
|---|---|---|
| Aviso "Falta configurar o banco" | `js/supabase.js` sem URL/chave | Seção 1, passos 5 e 6 |
| Tela em branco | Abriu com duplo clique, ou o servidor não usa `greys-app` como raiz | Seção 2 |
| Tela em branco no site publicado | Sem internet, ou o CDN do Supabase fora do ar | Aperte F12 e veja a aba *Console* |
| "Sem conexão com o servidor" | Projeto do Supabase pausado ou sem internet | Painel do Supabase → **Restore project** |
| "Conta criada, mas o Supabase pediu confirmação" | **Confirm email** ligado | Seção 1, passo 4 |
| "E-mail ou senha incorretos" logo depois de criar conta | Mesmo motivo acima (conta não confirmada) | Seção 1, passo 4 |
| Mudei o site e o celular mostra o antigo | Cópia guardada pelo app | Feche e abra o app de novo (ou troque `greys-v3` em `sw.js`) |
| "Algum valor está fora do permitido" | O banco recusou um valor (ex.: uma opção nova num `<select>`) | As opções do HTML precisam ser iguais às do `01-estrutura.sql` |

## 7. Pendências do grupo

- [ ] **Documento de requisitos**: preencher [requisitos-modelo.md](requisitos-modelo.md) com o que a Enfermagem respondeu.
- [ ] **Validar o texto do Setembro Amarelo com a Enfermagem** (`pages/setembro-amarelo.html`)
      e colocar o crédito da validação no fim da página.
- [ ] Validar com a Enfermagem as faixas que destacam sinais alterados
      (`js/paginas/sinais-vitais.js`, objeto `SINAIS`).
- [ ] Atualizar o Figma com a lista de [mudancas-figma.md](mudancas-figma.md).
- [ ] Criar o Supabase (seção 1) e publicar no Netlify (seção 3).
- [ ] Passar pelo roteiro de teste (seção 5) com o Supabase de verdade.
- [ ] Registrar os feedbacks das apresentações (vale nota).
