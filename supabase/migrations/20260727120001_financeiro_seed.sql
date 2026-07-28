-- ============================================================================
-- MÓDULO FINANCEIRO — seed de importação da planilha 2026 (Fase 2)
--
-- Fonte: planilha_its_servo.xlsx (abas GERAL, ENGENHO NOVO, ARISTON, SEDE,
-- OSASCO, CORRESPONDÊNCIA), lançamentos de jan–jun/2026.
--
-- Convenções:
--  - A planilha não registra o DIA do pagamento; todo lançamento importado usa
--    data = competencia = dia 1 do mês. A competência é o que rege os
--    relatórios, então a imprecisão de `data` no histórico é inócua.
--  - Categoria "Matrícula" quando o valor da célula = 190 (taxa 40+150);
--    demais valores = "Mensalidade".
--  - Saldo inicial (R$ 13.067,29) = lançamento de ajuste em dez/2025, unidade
--    NULL — assim o "saldo anterior" de qualquer mês é uma soma uniforme.
--  - Mapeamento aba→slug: SEDE→sede_jd_santa_monica, ENGENHO NOVO→engenho_novo,
--    OSASCO→jd_conceicao, ARISTON→ariston, CORRESPONDÊNCIA→correspondencia.
--
-- O bloco final de ASSERTs confere os totais contra a aba GERAL e FALHA a
-- migration se a transcrição divergir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Categorias (pré-carga)
-- ----------------------------------------------------------------------------
INSERT INTO public.categorias_financeiras (nome, tipo) VALUES
  ('Mensalidade',              'entrada'),
  ('Matrícula',                'entrada'),
  ('Ofertas ITS / Patrocínio', 'entrada'),
  ('Simpósio',                 'entrada'),
  ('Saldo inicial',            'entrada'),
  ('Simpósio',                 'saida'),
  ('Custos Doc. Cartório',     'saida'),
  ('Aquisição de livros',      'saida'),
  ('Aquisição de materiais',   'saida'),
  ('Ajuda de custo Professor', 'saida'),
  ('Devolução Matrícula/Livros','saida'),
  ('Contabilidade Lobato',     'saida')
ON CONFLICT (nome, tipo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) Saldo inicial (transportado da gestão anterior)
-- ----------------------------------------------------------------------------
INSERT INTO public.lancamentos_financeiros (tipo, valor, data, competencia, unidade, categoria_id, descricao)
SELECT
  'entrada', 13067.29, DATE '2025-12-31', DATE '2025-12-01', NULL,
  (SELECT id FROM public.categorias_financeiras WHERE nome = 'Saldo inicial' AND tipo = 'entrada'),
  'Saldo transportado da planilha (anterior a jan/2026)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.lancamentos_financeiros WHERE descricao LIKE 'Saldo transportado%'
);

-- ----------------------------------------------------------------------------
-- 3) Alunos legados (nomes das abas; sem inscricao_id)
--    Idempotente: só insere se ainda não existe nenhum aluno legado.
-- ----------------------------------------------------------------------------
INSERT INTO public.alunos (nome, unidade)
SELECT v.nome, v.unidade FROM (VALUES
  -- ENGENHO NOVO (13)
  ('LUCAS SILVA DE LIMA',            'engenho_novo'),
  ('ALMERISO DOS SANTOS',            'engenho_novo'),
  ('MATHEUS HENRIQUE',               'engenho_novo'),
  ('JOSE FLAVIANO DOS PASSOS SILVA', 'engenho_novo'),
  ('DEBORA',                         'engenho_novo'),
  ('JANAINA S. DOS SANTOS',          'engenho_novo'),
  ('CAIQUE DA SILVA SANTOS',         'engenho_novo'),
  ('OSMAR DA COSTA VEIGA',           'engenho_novo'),
  ('CRISTINA B. MIRANDA MORAIS',     'engenho_novo'),
  ('HELENA FERREIRA NERIS',          'engenho_novo'),
  ('FABIO SANTOS DE SOUZA',          'engenho_novo'),
  ('DAVI ROSENO GONÇALVES',          'engenho_novo'),
  ('IRANEIDE DOS SANTOS',            'engenho_novo'),
  -- ARISTON (17)
  ('ELI',           'ariston'),
  ('ALCINEU',       'ariston'),
  ('HELENA',        'ariston'),
  ('JOÃO VICTOR',   'ariston'),
  ('FERNANDO',      'ariston'),
  ('SÉRGIO',        'ariston'),
  ('TATIANE',       'ariston'),
  ('MOISÉS',        'ariston'),
  ('GRAÇA',         'ariston'),
  ('GILENO',        'ariston'),
  ('ARTHUR',        'ariston'),
  ('THAIS',         'ariston'),
  ('IRACEMA',       'ariston'),
  ('REINALDO',      'ariston'),
  ('NETE',          'ariston'),
  ('NILSON',        'ariston'),
  ('RITA FABIANA',  'ariston'),
  -- SEDE (9)
  ('ANTÔNIO TEIXEIRA DE SOUZA',    'sede_jd_santa_monica'),
  ('JOÃO VICTOR C. DA SILVA',      'sede_jd_santa_monica'),
  ('NEUSA SANCHES',                'sede_jd_santa_monica'),
  ('ROSITA',                       'sede_jd_santa_monica'),
  ('BIANCA SOUSA LOPES SOARES',    'sede_jd_santa_monica'),
  ('EDINALDO L. DOS S. J.',        'sede_jd_santa_monica'),
  ('LEILA SAMA DOS S. V.',         'sede_jd_santa_monica'),
  ('FERNANDA DELFINO PADILHA',     'sede_jd_santa_monica'),
  ('WASHINGTON ALVES DOS SANTOS',  'sede_jd_santa_monica'),
  -- OSASCO / Jd. Conceição (12)
  ('JOSY',                          'jd_conceicao'),
  ('DAVID DE SOUZA',                'jd_conceicao'),
  ('DANIELE MARIA LOPES',           'jd_conceicao'),
  ('TATYANA P.C. DA SILVA',         'jd_conceicao'),
  ('JESSICA HIPPOLITO DE O.',       'jd_conceicao'),
  ('MARIANA P. C. DA SILVA',        'jd_conceicao'),
  ('PAULO HENRIQUE DE O. G.',       'jd_conceicao'),
  ('ROSANA MARIA DOS SANTOS',       'jd_conceicao'),
  ('CARLOS EDUARDO GOES FERREIRA',  'jd_conceicao'),
  ('RONALD DOS SANTOS',             'jd_conceicao'),
  ('MARIA CLARA S. Q. BASTOS',      'jd_conceicao'),
  ('DULCELINA APARECIDA GONÇALVES', 'jd_conceicao'),
  -- CORRESPONDÊNCIA (12)
  ('DAMARES',                        'correspondencia'),
  ('CESAR E ANA',                    'correspondencia'),
  ('JOSÉ FERNANDES (S. PARNAIBA)',   'correspondencia'),
  ('LUCIANA JESUS DA SILVA',         'correspondencia'),
  ('ERISSON BRUNO FERREIRA SANTOS',  'correspondencia'),
  ('GILVANO PEREIRA DE SOUZA',       'correspondencia'),
  ('ALAN BORGES DE A. SANTOS',       'correspondencia'),
  ('ELZA MARIA AVILA SANTOS',        'correspondencia'),
  ('FABRICIO MIRANDA DO L.',         'correspondencia'),
  ('INARA BRENDA',                   'correspondencia'),
  ('IRANEIDE DOS SANTOS BARBOSA',    'correspondencia'),
  ('GERALDO LOPES DA SILVA',         'correspondencia')
) AS v(nome, unidade)
WHERE NOT EXISTS (SELECT 1 FROM public.alunos WHERE inscricao_id IS NULL);

-- ----------------------------------------------------------------------------
-- 4) Pagamentos de alunos jan–jun/2026 (células não-zero das abas por unidade)
--    O DO-block confere que o JOIN não descartou nenhuma linha.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  esperado INT;
  inserido INT;
BEGIN
  -- Idempotente: lote já importado → pula.
  IF EXISTS (SELECT 1 FROM public.lancamentos_financeiros WHERE descricao = 'Importado da planilha 2026') THEN
    RAISE NOTICE 'Seed de pagamentos já aplicado — pulando.';
    RETURN;
  END IF;

  WITH pagamentos (nome, unidade, mes, valor) AS (
    VALUES
      -- ENGENHO NOVO
      ('ALMERISO DOS SANTOS',            'engenho_novo', 3, 150.00),
      ('ALMERISO DOS SANTOS',            'engenho_novo', 6, 150.00),
      ('MATHEUS HENRIQUE',               'engenho_novo', 6, 150.00),
      ('JOSE FLAVIANO DOS PASSOS SILVA', 'engenho_novo', 2, 190.00),
      ('JOSE FLAVIANO DOS PASSOS SILVA', 'engenho_novo', 4, 150.00),
      ('DEBORA',                         'engenho_novo', 5, 150.00),
      ('JANAINA S. DOS SANTOS',          'engenho_novo', 5, 150.00),
      ('CAIQUE DA SILVA SANTOS',         'engenho_novo', 1,  50.00),
      ('CAIQUE DA SILVA SANTOS',         'engenho_novo', 3, 150.00),
      ('OSMAR DA COSTA VEIGA',           'engenho_novo', 3, 300.00),
      ('OSMAR DA COSTA VEIGA',           'engenho_novo', 6, 150.00),
      ('CRISTINA B. MIRANDA MORAIS',     'engenho_novo', 3, 100.00),
      ('HELENA FERREIRA NERIS',          'engenho_novo', 3, 150.00),
      ('FABIO SANTOS DE SOUZA',          'engenho_novo', 3, 150.00),
      ('FABIO SANTOS DE SOUZA',          'engenho_novo', 6, 150.00),
      ('DAVI ROSENO GONÇALVES',          'engenho_novo', 3,  40.00),
      ('DAVI ROSENO GONÇALVES',          'engenho_novo', 6, 100.00),
      ('IRANEIDE DOS SANTOS',            'engenho_novo', 4, 150.00),
      ('IRANEIDE DOS SANTOS',            'engenho_novo', 5, 150.00),
      ('IRANEIDE DOS SANTOS',            'engenho_novo', 6, 150.00),
      -- ARISTON
      ('ELI',          'ariston', 5, 150.00),
      ('SÉRGIO',       'ariston', 5, 150.00),
      ('TATIANE',      'ariston', 5, 150.00),
      ('MOISÉS',       'ariston', 3, 150.00),
      ('ARTHUR',       'ariston', 3, 150.00),
      ('THAIS',        'ariston', 3, 150.00),
      ('IRACEMA',      'ariston', 3, 150.00),
      ('RITA FABIANA', 'ariston', 1, 450.00),
      -- OSASCO / Jd. Conceição
      ('JOSY',                          'jd_conceicao', 1,  50.00),
      ('JOSY',                          'jd_conceicao', 2,  50.00),
      ('DAVID DE SOUZA',                'jd_conceicao', 1,  50.00),
      ('DAVID DE SOUZA',                'jd_conceicao', 2,  50.00),
      ('DAVID DE SOUZA',                'jd_conceicao', 4, 200.00),
      ('DANIELE MARIA LOPES',           'jd_conceicao', 1,  50.00),
      ('DANIELE MARIA LOPES',           'jd_conceicao', 3, 100.00),
      ('DANIELE MARIA LOPES',           'jd_conceicao', 5, 100.00),
      ('DANIELE MARIA LOPES',           'jd_conceicao', 6, 100.00),
      ('MARIANA P. C. DA SILVA',        'jd_conceicao', 1, 100.00),
      ('PAULO HENRIQUE DE O. G.',       'jd_conceicao', 1,  50.00),
      ('PAULO HENRIQUE DE O. G.',       'jd_conceicao', 4, 100.00),
      ('RONALD DOS SANTOS',             'jd_conceicao', 1,  90.00),
      ('DULCELINA APARECIDA GONÇALVES', 'jd_conceicao', 2,  50.00),
      ('DULCELINA APARECIDA GONÇALVES', 'jd_conceicao', 5, 100.00),
      -- CORRESPONDÊNCIA
      ('ELZA MARIA AVILA SANTOS',       'correspondencia', 3, 150.00),
      ('INARA BRENDA',                  'correspondencia', 1, 140.00),
      ('IRANEIDE DOS SANTOS BARBOSA',   'correspondencia', 3, 190.00),
      ('GERALDO LOPES DA SILVA',        'correspondencia', 3, 150.00),
      ('GERALDO LOPES DA SILVA',        'correspondencia', 4, 200.00)
  ),
  contagem AS (SELECT count(*) AS n FROM pagamentos),
  ins AS (
    INSERT INTO public.lancamentos_financeiros
      (tipo, valor, data, competencia, unidade, categoria_id, aluno_id, descricao)
    SELECT
      'entrada',
      p.valor,
      make_date(2026, p.mes, 1),
      make_date(2026, p.mes, 1),
      p.unidade,
      (SELECT c.id FROM public.categorias_financeiras c
        WHERE c.tipo = 'entrada'
          AND c.nome = CASE WHEN p.valor = 190.00 THEN 'Matrícula' ELSE 'Mensalidade' END),
      a.id,
      'Importado da planilha 2026'
    FROM pagamentos p
    JOIN public.alunos a ON a.nome = p.nome AND a.unidade = p.unidade
    RETURNING 1
  )
  SELECT (SELECT n FROM contagem), count(*) INTO esperado, inserido FROM ins;

  ASSERT inserido = esperado,
    format('Import de pagamentos: %s de %s linhas inseridas (nome/unidade sem aluno correspondente).', inserido, esperado);
END $$;

-- ----------------------------------------------------------------------------
-- 5) Movimentos gerais (aba GERAL) — único não-zero em jan–jun:
--    Aquisição de materiais, saída de R$ 1.000,00 em junho.
-- ----------------------------------------------------------------------------
INSERT INTO public.lancamentos_financeiros (tipo, valor, data, competencia, unidade, categoria_id, descricao)
SELECT
  'saida', 1000.00, DATE '2026-06-01', DATE '2026-06-01', NULL,
  (SELECT id FROM public.categorias_financeiras WHERE nome = 'Aquisição de materiais' AND tipo = 'saida'),
  'Importado da planilha 2026 (aba GERAL)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.lancamentos_financeiros WHERE descricao = 'Importado da planilha 2026 (aba GERAL)'
);

-- ----------------------------------------------------------------------------
-- 6) Conferência contra a aba GERAL — falha a migration se a transcrição
--    divergir. Escopada ao LOTE IMPORTADO (descricao do seed), para não quebrar
--    caso já existam alunos/lançamentos reais no banco no momento do push.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  esperado_mes NUMERIC[] := ARRAY[1030, 340, 2230, 800, 1100, 950]; -- ENTRADA MÊS jan..jun
  soma NUMERIC;
  m INT;
BEGIN
  -- total de alunos LEGADOS importados (os do trigger têm inscricao_id)
  SELECT count(*) INTO soma FROM public.alunos WHERE inscricao_id IS NULL;
  ASSERT soma = 63, format('Esperados 63 alunos legados, encontrados %s', soma);

  -- ENTRADA MÊS por mês (somente o lote importado)
  FOR m IN 1..6 LOOP
    SELECT COALESCE(sum(valor), 0) INTO soma
      FROM public.lancamentos_financeiros
      WHERE tipo = 'entrada' AND competencia = make_date(2026, m, 1)
        AND descricao LIKE 'Importado da planilha 2026%';
    ASSERT soma = esperado_mes[m],
      format('ENTRADA MÊS %s: esperado %s, obtido %s', m, esperado_mes[m], soma);
  END LOOP;

  -- SAÍDA de junho (lote importado)
  SELECT COALESCE(sum(valor), 0) INTO soma
    FROM public.lancamentos_financeiros
    WHERE tipo = 'saida' AND competencia = DATE '2026-06-01'
      AND descricao LIKE 'Importado da planilha 2026%';
  ASSERT soma = 1000, format('SAÍDA jun: esperado 1000, obtido %s', soma);

  -- amostras por unidade (rodapés das abas; lote importado)
  SELECT COALESCE(sum(valor), 0) INTO soma FROM public.lancamentos_financeiros
    WHERE unidade = 'engenho_novo' AND tipo = 'entrada' AND competencia = DATE '2026-03-01'
      AND descricao LIKE 'Importado da planilha 2026%';
  ASSERT soma = 1040, format('Engenho Novo mar: esperado 1040, obtido %s', soma);

  SELECT COALESCE(sum(valor), 0) INTO soma FROM public.lancamentos_financeiros
    WHERE unidade = 'ariston' AND tipo = 'entrada'
      AND descricao LIKE 'Importado da planilha 2026%';
  ASSERT soma = 1500, format('Ariston total: esperado 1500, obtido %s', soma);

  SELECT COALESCE(sum(valor), 0) INTO soma FROM public.lancamentos_financeiros
    WHERE unidade = 'jd_conceicao' AND tipo = 'entrada' AND competencia = DATE '2026-01-01'
      AND descricao LIKE 'Importado da planilha 2026%';
  ASSERT soma = 390, format('Osasco jan: esperado 390, obtido %s', soma);

  SELECT COALESCE(sum(valor), 0) INTO soma FROM public.lancamentos_financeiros
    WHERE unidade = 'correspondencia' AND tipo = 'entrada' AND competencia = DATE '2026-03-01'
      AND descricao LIKE 'Importado da planilha 2026%';
  ASSERT soma = 490, format('Correspondência mar: esperado 490, obtido %s', soma);

  -- SALDO acumulado até jun/2026 do lote (saldo inicial + importados) = G23
  SELECT COALESCE(sum(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) INTO soma
    FROM public.lancamentos_financeiros
    WHERE competencia <= DATE '2026-06-01'
      AND (descricao LIKE 'Importado da planilha 2026%' OR descricao LIKE 'Saldo transportado%');
  ASSERT soma = 18517.29, format('Saldo até jun/2026: esperado 18517.29, obtido %s', soma);

  RAISE NOTICE 'Seed financeiro conferido com a planilha: OK';
END $$;
