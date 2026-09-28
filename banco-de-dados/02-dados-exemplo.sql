-- =====================================================================
--  Dados de exemplo (FICTÍCIOS) para testar e apresentar o app.
--  Rode DEPOIS do 01-estrutura.sql. Se rodar de novo, duplica os dados.
-- =====================================================================

insert into pacientes (nome, data_nasc, leito, nome_mae, setor, estado_clinico, alergias, diagnostico, info_sigilosa, admissao) values
  ('Maria Aparecida Silva', '1964-03-12', '12', 'Joana Silva', 'Clínica Médica - Ala B', 'Estável',
   'Penicilina', 'Pneumonia comunitária', 'Hipertensa há 10 anos. Cirurgia de vesícula em 2018.', now() - interval '5 days'),
  ('José Carlos Pereira', '1951-11-02', '14', 'Ana Pereira', 'Clínica Médica - Ala B', 'Em observação',
   null, 'ICC descompensada', null, now() - interval '2 days');

-- Uma passagem de plantão do turno anterior (aparece no Histórico)
insert into registros_plantao (paciente_id, tipo, texto, data_hora)
select id, 'passagem',
  'Paciente em O2 por cateter nasal a 2 L/min. Aceitou a dieta. Acesso venoso em MSE, sem sinais de flebite. Sem queixa de dor.',
  now() - interval '12 hours'
from pacientes where nome = 'Maria Aparecida Silva';

-- Prescrição da Maria (um horário por linha)
insert into medicacoes (paciente_id, nome, via, frequencia, horario)
select p.id, m.nome, m.via, m.frequencia, m.horario::time
from pacientes p, (values
  ('Ceftriaxona 1g',     'EV', '12/12h',   '08:00'),
  ('Azitromicina 500mg', 'VO', '1x/dia',   '10:00'),
  ('Omeprazol 40mg',     'EV', '1x/dia',   '12:00'),
  ('Dipirona 1g',        'EV', 'se febre', '14:00'),
  ('Enoxaparina 40mg',   'SC', '1x/dia',   '18:00'),
  ('Ceftriaxona 1g',     'EV', '12/12h',   '20:00')
) as m(nome, via, frequencia, horario)
where p.nome = 'Maria Aparecida Silva';

insert into exames (paciente_id, nome, status, solicitado_em)
select p.id, e.nome, e.status, now() - e.dias * interval '1 day'
from pacientes p, (values
  ('Hemograma completo',  'Disponível', 1),
  ('PCR',                 'Disponível', 1),
  ('Raio-X de tórax',     'Pendente',   0),
  ('Gasometria arterial', 'Em análise', 0),
  ('Hemocultura',         'Em análise', 2)
) as e(nome, status, dias)
where p.nome = 'Maria Aparecida Silva';

insert into sinais_vitais (paciente_id, pa_sist, pa_diast, fc, temp, spo2, fr, dor, aferido_em)
select id, 120, 80, 78, 36.5, 98, 16, 2, now() - interval '3 hours'
from pacientes where nome = 'Maria Aparecida Silva';

insert into observacoes (paciente_id, texto, criado_em)
select id, 'Paciente aceitou bem a dieta. Deambulando com auxílio.', now() - interval '4 hours'
from pacientes where nome = 'Maria Aparecida Silva';
