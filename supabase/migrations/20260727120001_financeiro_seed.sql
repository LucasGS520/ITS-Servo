-- Categorias iniciais do modulo financeiro.
-- A importacao historica de 2026 foi removida: um banco novo deve iniciar sem
-- alunos, lancamentos ou saldo presumido. Os dados atuais entram por importacao
-- conferida com o ITS, fora das migrations de estrutura.
INSERT INTO public.categorias_financeiras (nome, tipo) VALUES
  ('Mensalidade', 'entrada'),
  ('Matrícula', 'entrada'),
  ('Ofertas ITS / Patrocínio', 'entrada'),
  ('Simpósio', 'entrada'),
  ('Saldo inicial', 'entrada'),
  ('Simpósio', 'saida'),
  ('Custos Doc. Cartório', 'saida'),
  ('Aquisição de livros', 'saida'),
  ('Aquisição de materiais', 'saida'),
  ('Ajuda de custo Professor', 'saida'),
  ('Devolução Matrícula/Livros', 'saida'),
  ('Contabilidade Lobato', 'saida')
ON CONFLICT (nome, tipo) DO NOTHING;
