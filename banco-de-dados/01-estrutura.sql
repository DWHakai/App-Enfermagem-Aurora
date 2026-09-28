-- =====================================================================
--  Grey's Anatomy Hospital — estrutura do banco de dados
--  (Supabase / PostgreSQL). App usado só pela EQUIPE DE ENFERMAGEM.
--
--  Como usar: Supabase > SQL Editor > New query > colar tudo > Run.
--  Pode rodar de novo sem dar erro.
-- =====================================================================


-- ---------------------------------------------------------------------
--  PERFIS: quem usa o app (enfermeiras, técnicas, estudantes)
--  O e-mail e a senha ficam numa tabela interna do Supabase (auth.users).
--  Aqui ficam os outros dados da pessoa.
-- ---------------------------------------------------------------------
create table if not exists perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null,
  funcao    text,
  setor     text,
  plantao   text,
  criado_em timestamptz not null default now()
);

-- Gatilho (trigger): quando alguém cria uma conta, copia os dados do
-- formulário "Criar conta" para a tabela perfis.
-- "security definer" = roda com a permissão do dono do banco. Precisa
-- disso porque quem grava a conta nova é o sistema de login do Supabase.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome, funcao, setor, plantao)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    new.raw_user_meta_data ->> 'funcao',
    new.raw_user_meta_data ->> 'setor',
    new.raw_user_meta_data ->> 'plantao'
  );
  return new;
end;
$$;

drop trigger if exists ao_criar_conta on auth.users;
create trigger ao_criar_conta
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Se alguma conta foi criada ANTES deste script, cria o perfil dela agora.
insert into perfis (id, nome)
select id, coalesce(raw_user_meta_data ->> 'nome', email) from auth.users
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
--  Em todas as tabelas abaixo, "autor_id" guarda QUEM registrou.
--  "default auth.uid()" = o próprio banco preenche com o usuário logado,
--  então o app não precisa mandar (e as regras do fim do arquivo não
--  deixam mandar o nome de outra pessoa).
-- ---------------------------------------------------------------------

-- PACIENTES
create table if not exists pacientes (
  id             bigint generated always as identity primary key,
  nome           text not null,
  data_nasc      date not null,
  leito          text,
  nome_mae       text,
  setor          text,
  estado_clinico text check (estado_clinico in ('Estável', 'Em observação', 'Grave', 'Crítico')),
  diagnostico    text,
  alergias       text,
  info_sigilosa  text,
  admissao       timestamptz not null default now(),
  autor_id       uuid default auth.uid() references perfis(id)
);

-- PASSAGEM DE PLANTÃO e EVOLUÇÃO DE ENFERMAGEM (funcionalidade principal)
create table if not exists registros_plantao (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  tipo        text not null check (tipo in ('passagem', 'evolucao')),
  texto       text not null check (trim(texto) <> ''),
  data_hora   timestamptz not null default now(),
  criado_em   timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id)
);

-- SINAIS VITAIS: pode salvar só o que foi medido (o resto fica vazio)
create table if not exists sinais_vitais (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  pa_sist     int          check (pa_sist  between 40 and 300),  -- mmHg
  pa_diast    int          check (pa_diast between 20 and 200),  -- mmHg
  fc          int          check (fc   between 20 and 250),      -- bpm
  temp        numeric(3,1) check (temp between 30 and 45),       -- graus C
  spo2        int          check (spo2 between 50 and 100),      -- %
  fr          int          check (fr   between 4 and 60),        -- irpm
  dor         int          check (dor  between 0 and 10),        -- escala 0 a 10
  aferido_em  timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id),
  -- pelo menos um valor preenchido
  check (num_nonnulls(pa_sist, pa_diast, fc, temp, spo2, fr, dor) > 0),
  -- a pressão vem sempre em par (sistólica/diastólica)...
  check ((pa_sist is null) = (pa_diast is null)),
  -- ...e a diastólica é menor que a sistólica
  check (pa_diast < pa_sist)
);

-- MEDICAÇÕES: a enfermagem transcreve a prescrição, um horário por linha
-- (aprazamento). Ex.: 12/12h vira duas linhas, 08:00 e 20:00.
create table if not exists medicacoes (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  nome        text not null,     -- ex.: Ceftriaxona 1g
  via         text,              -- EV, VO, SC, IM...
  frequencia  text,              -- ex.: 12/12h
  horario     time not null,
  criado_em   timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id)
);

-- Cada dose checada (administrada)
create table if not exists administracoes (
  id              bigint generated always as identity primary key,
  medicacao_id    bigint not null references medicacoes(id) on delete cascade,
  paciente_id     bigint not null references pacientes(id) on delete cascade,
  dia             date not null,
  administrado_em timestamptz not null default now(),
  autor_id        uuid default auth.uid() references perfis(id),
  unique (medicacao_id, dia)     -- a mesma dose não pode ser checada 2x no dia
);

-- EXAMES
create table if not exists exames (
  id            bigint generated always as identity primary key,
  paciente_id   bigint not null references pacientes(id) on delete cascade,
  nome          text not null,
  status        text not null default 'Pendente'
                check (status in ('Pendente', 'Em análise', 'Disponível')),
  solicitado_em timestamptz not null default now(),
  autor_id      uuid default auth.uid() references perfis(id)
);

-- OBSERVAÇÕES
create table if not exists observacoes (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  texto       text not null check (trim(texto) <> ''),
  criado_em   timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id)
);


-- =====================================================================
--  PERMISSÕES
--  anon          = quem NÃO fez login: não acessa nada.
--  authenticated = quem fez login: lê e registra. Nunca apaga, e a única
--                  coisa que altera é o status do exame.
--  Como no prontuário de papel, o que foi registrado não se edita:
--  se errou, faz um registro novo.
-- =====================================================================
-- O Supabase já vem liberando tudo (até apagar), então primeiro tira tudo
-- e depois dá só o necessário.
revoke all on all tables in schema public from anon, authenticated;
grant select, insert on all tables in schema public to authenticated;
grant update (status) on exames to authenticated;

-- RLS (Row Level Security): além da permissão, cada tabela tem regras
-- que o banco confere linha por linha.
alter table pacientes         enable row level security;
alter table registros_plantao enable row level security;
alter table sinais_vitais     enable row level security;
alter table medicacoes        enable row level security;
alter table administracoes    enable row level security;
alter table exames            enable row level security;
alter table observacoes       enable row level security;
alter table perfis            enable row level security;

-- Apaga as regras antigas para o arquivo poder rodar de novo
drop policy if exists "equipe le" on pacientes;
drop policy if exists "equipe le" on registros_plantao;
drop policy if exists "equipe le" on sinais_vitais;
drop policy if exists "equipe le" on medicacoes;
drop policy if exists "equipe le" on administracoes;
drop policy if exists "equipe le" on exames;
drop policy if exists "equipe le" on observacoes;
drop policy if exists "equipe le" on perfis;
drop policy if exists "registra no proprio nome" on pacientes;
drop policy if exists "registra no proprio nome" on registros_plantao;
drop policy if exists "registra no proprio nome" on sinais_vitais;
drop policy if exists "registra no proprio nome" on medicacoes;
drop policy if exists "registra no proprio nome" on administracoes;
drop policy if exists "registra no proprio nome" on exames;
drop policy if exists "registra no proprio nome" on observacoes;
drop policy if exists "muda o status" on exames;

-- Ler: qualquer pessoa da equipe logada vê todas as linhas.
create policy "equipe le" on pacientes         for select to authenticated using (true);
create policy "equipe le" on registros_plantao for select to authenticated using (true);
create policy "equipe le" on sinais_vitais     for select to authenticated using (true);
create policy "equipe le" on medicacoes        for select to authenticated using (true);
create policy "equipe le" on administracoes    for select to authenticated using (true);
create policy "equipe le" on exames            for select to authenticated using (true);
create policy "equipe le" on observacoes       for select to authenticated using (true);
create policy "equipe le" on perfis            for select to authenticated using (true);

-- Registrar: só no próprio nome (autor_id tem que ser quem está logado).
-- Perfis não entram aqui: quem cria o perfil é o gatilho do começo.
create policy "registra no proprio nome" on pacientes         for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on registros_plantao for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on sinais_vitais     for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on medicacoes        for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on administracoes    for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on exames            for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on observacoes       for insert to authenticated with check (autor_id = auth.uid());

-- Alterar: qualquer pessoa da equipe muda o status de qualquer exame
-- (a permissão lá em cima só deixa mexer na coluna status).
create policy "muda o status" on exames for update to authenticated using (true) with check (true);
