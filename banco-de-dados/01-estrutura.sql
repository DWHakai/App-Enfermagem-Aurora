-- Hospital Aurora Medical Center: estrutura do banco (Supabase). Pode rodar de novo.


-- Perfis da equipe (e-mail e senha ficam em auth.users)
create table if not exists perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null,
  funcao    text,
  setor     text,
  plantao   text,
  criado_em timestamptz not null default now()
);

-- cria o perfil quando alguém cria a conta
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

-- perfil de contas criadas antes deste script
insert into perfis (id, nome)
select id, coalesce(raw_user_meta_data ->> 'nome', email) from auth.users
on conflict (id) do nothing;


-- autor_id = quem registrou (o banco preenche com o usuário logado)

-- Pacientes
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

-- Passagem de plantão e evolução
create table if not exists registros_plantao (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  tipo        text not null check (tipo in ('passagem', 'evolucao')),
  texto       text not null check (trim(texto) <> ''),
  data_hora   timestamptz not null default now(),
  criado_em   timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id)
);

-- Sinais vitais (só o que foi medido)
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
  -- pressão sempre completa
  check ((pa_sist is null) = (pa_diast is null)),
  -- diastólica menor que a sistólica
  check (pa_diast < pa_sist)
);

-- Medicações (um horário por linha: 12/12h vira 08:00 e 20:00)
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

-- Doses checadas
create table if not exists administracoes (
  id              bigint generated always as identity primary key,
  medicacao_id    bigint not null references medicacoes(id) on delete cascade,
  paciente_id     bigint not null references pacientes(id) on delete cascade,
  dia             date not null,
  administrado_em timestamptz not null default now(),
  autor_id        uuid default auth.uid() references perfis(id),
  unique (medicacao_id, dia)     -- a mesma dose não pode ser checada 2x no dia
);

-- Exames
create table if not exists exames (
  id            bigint generated always as identity primary key,
  paciente_id   bigint not null references pacientes(id) on delete cascade,
  nome          text not null,
  status        text not null default 'Pendente'
                check (status in ('Pendente', 'Em análise', 'Disponível')),
  solicitado_em timestamptz not null default now(),
  autor_id      uuid default auth.uid() references perfis(id)
);

-- Observações
create table if not exists observacoes (
  id          bigint generated always as identity primary key,
  paciente_id bigint not null references pacientes(id) on delete cascade,
  texto       text not null check (trim(texto) <> ''),
  criado_em   timestamptz not null default now(),
  autor_id    uuid default auth.uid() references perfis(id)
);


-- Permissões: sem login não acessa nada; logado lê e registra, e só altera o status do exame.
-- O Supabase libera tudo por padrão, então tira tudo e dá só o necessário.
revoke all on all tables in schema public from anon, authenticated;
grant select, insert on all tables in schema public to authenticated;
grant update (status) on exames to authenticated;

-- RLS
alter table pacientes         enable row level security;
alter table registros_plantao enable row level security;
alter table sinais_vitais     enable row level security;
alter table medicacoes        enable row level security;
alter table administracoes    enable row level security;
alter table exames            enable row level security;
alter table observacoes       enable row level security;
alter table perfis            enable row level security;

-- apaga as regras antigas (para poder rodar de novo)
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

-- ler: toda a equipe logada
create policy "equipe le" on pacientes         for select to authenticated using (true);
create policy "equipe le" on registros_plantao for select to authenticated using (true);
create policy "equipe le" on sinais_vitais     for select to authenticated using (true);
create policy "equipe le" on medicacoes        for select to authenticated using (true);
create policy "equipe le" on administracoes    for select to authenticated using (true);
create policy "equipe le" on exames            for select to authenticated using (true);
create policy "equipe le" on observacoes       for select to authenticated using (true);
create policy "equipe le" on perfis            for select to authenticated using (true);

-- registrar: só no próprio nome
create policy "registra no proprio nome" on pacientes         for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on registros_plantao for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on sinais_vitais     for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on medicacoes        for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on administracoes    for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on exames            for insert to authenticated with check (autor_id = auth.uid());
create policy "registra no proprio nome" on observacoes       for insert to authenticated with check (autor_id = auth.uid());

-- alterar: só o status do exame
create policy "muda o status" on exames for update to authenticated using (true) with check (true);
