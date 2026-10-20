"""Prepara carga idempotente de 2026 sem copiar nomes para o repositório.

Uso: python supabase/scripts/prepare_2026.py --anual "...xlsx" --simposio "...xlsx" --output .planilhas_its/import_2026.sql
O arquivo de saída contém dados pessoais. Mantenha-o fora do controle de versão.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SHEETS = ["RELATÓRIO GERAL", "ENGENHO NOVO", "ARISTON", "SEDE", "OSASCO", "CORRESPONDÊNCIA"]
UNIDADES = [None, "engenho_novo", "ariston", "sede_jd_santa_monica", "jd_conceicao", "correspondencia"]
STUDENT_COUNTS = {2: 13, 3: 17, 4: 9, 5: 13, 6: 13}
GENERAL = {
    9: ("entrada", "Ofertas ITS / Patrocínio", None),
    10: ("entrada", "Capacitação de Obreiros", "capacitacao_obreiros"),
    11: ("entrada", "Simpósio", "simposio"),
    12: ("saida", "Simpósio", "simposio"),
    13: ("saida", "Custos Doc. Cartório", None),
    14: ("saida", "Aquisição de livros", None),
    15: ("saida", "Aquisição de materiais", None),
    16: ("saida", "Ajuda de custo Professor", None),
    17: ("saida", "Devolução Matrícula/Livros", None),
    18: ("saida", "Contabilidade Lobato", None),
}


def literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, Decimal)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    value = cell.find("m:v", NS)
    if value is None:
        inline = cell.find("m:is", NS)
        return "" if inline is None else "".join(inline.itertext())
    return strings[int(value.text or 0)] if cell.get("t") == "s" else value.text or ""


def read_sheets(path: Path) -> list[dict[int, dict[str, str]]]:
    with zipfile.ZipFile(path) as book:
        strings_path = "xl/sharedStrings.xml"
        strings = ["".join(item.itertext()) for item in ET.fromstring(book.read(strings_path)).findall("m:si", NS)] if strings_path in book.namelist() else []
        workbook = ET.fromstring(book.read("xl/workbook.xml"))
        names = [sheet.get("name") for sheet in workbook.findall("m:sheets/m:sheet", NS)]
        if len(names) == 6 and names != SHEETS:
            raise ValueError(f"Abas da planilha anual inesperadas: {names}")
        sheets = []
        for number in range(1, len(names) + 1):
            root = ET.fromstring(book.read(f"xl/worksheets/sheet{number}.xml"))
            rows = {}
            for row in root.findall(".//m:sheetData/m:row", NS):
                rows[int(row.get("r", "0"))] = {re.match(r"[A-Z]+", cell.get("r", ""))[0]: cell_value(cell, strings) for cell in row.findall("m:c", NS)}
            sheets.append(rows)
        return sheets


def amount(value: str | None) -> Decimal:
    return Decimal(value or "0").quantize(Decimal("0.01"))


def month(column: int) -> str:
    return f"2026-{column:02d}-01"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--anual", type=Path, required=True)
    parser.add_argument("--simposio", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    annual = read_sheets(args.anual)
    event = read_sheets(args.simposio)[0]
    if len(annual) != 6:
        raise ValueError("A planilha anual precisa ter seis abas")
    sha_annual = hashlib.sha256(args.anual.read_bytes()).hexdigest()
    sha_event = hashlib.sha256(args.simposio.read_bytes()).hexdigest()
    students: list[tuple[int, int, str, str, list[tuple[int, Decimal]]]] = []
    months_by_unit: dict[tuple[int, int], Decimal] = defaultdict(Decimal)
    value_cells = 0
    for sheet_number in range(2, 7):
        rows = annual[sheet_number - 1]
        for row_number in range(3, 3 + STUDENT_COUNTS[sheet_number]):
            row = rows[row_number]
            name = row.get("A", "").strip()
            if not name:
                raise ValueError(f"Nome ausente na aba {sheet_number}, linha {row_number}")
            values = []
            for m in range(1, 10):
                value = amount(row.get(chr(65 + m)))
                if value > 0:
                    values.append((m, value))
                    months_by_unit[(sheet_number, m)] += value
                    value_cells += 1
            students.append((sheet_number, row_number, name, UNIDADES[sheet_number - 1], values))
    if len(students) != 65 or value_cells != 67 or sum(months_by_unit.values()) != Decimal("9170.00"):
        raise ValueError(f"Total de alunos ou recebimentos diverge: alunos={len(students)}, células={value_cells}, total={sum(months_by_unit.values())}")
    annual_unit_rows = {2: 4, 3: 7, 4: 6, 5: 5, 6: 3}
    for sheet_number in range(2, 7):
        for m in range(1, 10):
            total = months_by_unit[(sheet_number, m)]
            source_total = amount(annual[0][annual_unit_rows[sheet_number]].get(chr(65 + m)))
            if total != source_total:
                raise ValueError(f"Divergência no núcleo {sheet_number}, mês {m}: {total} x {source_total}")
    event_income = sum((amount(event[r].get("B")) for r in range(5, 19)), Decimal(0))
    event_expense = sum((amount(event[r].get("C")) for r in range(19, 33)), Decimal(0))
    if event_income != Decimal("11480.00") or event_expense != Decimal("8575.43"):
        raise ValueError("Totais do Simpósio não coincidem com a planilha anexada")
    income = sum((amount(annual[0][r].get(chr(65 + m))) for r in [3, 4, 5, 6, 7, 9, 10, 11] for m in range(1, 10)), Decimal(0))
    expense = sum((amount(annual[0][r].get(chr(65 + m))) for r in [12, 13, 14, 15, 16, 17, 18] for m in range(1, 10)), Decimal(0))
    if income != Decimal("22350.00") or expense != Decimal("10787.99"):
        raise ValueError("Totais do relatório anual não coincidem com o diagnóstico")

    sql = ["-- Dados pessoais: arquivo gerado localmente. Não versionar.", "DO $its$ DECLARE v_p UUID; v_a UUID; v_l UUID; v_c UUID; v_e UUID; v_n UUID; v_r UUID; BEGIN"]
    for source, sha in [("PLANILHA ANUAL 2026.xlsx", sha_annual), ("PLANILHA FINANCEIRA SIMPÓSIO 2026.xlsx", sha_event)]:
        sql.append(f"IF EXISTS (SELECT 1 FROM public.importacoes_its WHERE fonte={literal(source)} AND sha256<>{literal(sha)}) THEN RAISE EXCEPTION 'Arquivo de origem alterado: {source}'; END IF;")
        sql.append(f"INSERT INTO public.importacoes_its(fonte,sha256) VALUES({literal(source)},{literal(sha)}) ON CONFLICT DO NOTHING;")
    sql.append("SELECT id INTO v_c FROM public.cursos WHERE codigo='teologico'; IF v_c IS NULL THEN RAISE EXCEPTION 'Curso Teologico ausente'; END IF;")
    for sheet_number, row_number, name, unit, values in students:
        key = f"anual2026:aba{sheet_number}:linha{row_number}"
        sql.append(f"INSERT INTO public.pessoas(nome_completo,identidade_pendente,origem_referencia) VALUES({literal(name)},true,{literal(key)}) ON CONFLICT DO NOTHING;")
        sql.append(f"SELECT id INTO v_p FROM public.pessoas WHERE origem_referencia={literal(key)};")
        nucleus = "NULL" if unit == "correspondencia" else f"(SELECT id FROM public.nucleos WHERE slug={literal(unit)})"
        sql.append(f"INSERT INTO public.alunos(nome,unidade,nucleo_id,pessoa_id,curso_id,ativo,situacao,origem_referencia) VALUES({literal(name)},{literal(unit)},{nucleus},v_p,v_c,false,'pendente_validacao',{literal(key)}) ON CONFLICT DO NOTHING;")
        sql.append(f"SELECT id INTO v_a FROM public.alunos WHERE origem_referencia={literal(key)};")
        for m, value in values:
            item = f"{key}:mes{m:02d}"
            sql.append(f"INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,nucleo_id,categoria_id,aluno_id,curso_id,descricao,origem,origem_referencia,conciliacao_status) VALUES('entrada',{value},NULL,{literal(month(m))},{literal(month(m))},'mes',{literal(unit)},{nucleus},(SELECT id FROM public.categorias_financeiras WHERE nome='Curso Teológico' AND tipo='entrada'),v_a,v_c,'Histórico mensal; dia e competência paga desconhecidos','legado',{literal(item)},'provisorio') ON CONFLICT DO NOTHING;")
            sql.append(f"SELECT id INTO v_l FROM public.lancamentos_financeiros WHERE origem_referencia={literal(item)};")
            sql.append(f"INSERT INTO public.recebimentos_its(pessoa_id,aluno_id,curso_id,lancamento_id,valor,mes_caixa,precisao_data,tipo,origem,origem_referencia) VALUES(v_p,v_a,v_c,v_l,{value},{literal(month(m))},'mes','outro','historico',{literal(item)}) ON CONFLICT DO NOTHING;")
    sql.append("INSERT INTO public.saldos_iniciais_its(ano,valor,fonte) VALUES(2026,13067.29,'PLANILHA ANUAL 2026.xlsx:RELATÓRIO GERAL:B21') ON CONFLICT DO NOTHING;")
    sql.append("INSERT INTO public.edicoes_simposio(nome,valor,ativo,publico,inscritos_historicos,pagantes_historicos,isentos_historicos,origem_referencia) VALUES('14º Simpósio — Capacitação de Obreiros',70,false,false,173,159,14,'simposio2026') ON CONFLICT DO NOTHING;")
    sql.append("SELECT id INTO v_e FROM public.edicoes_simposio WHERE origem_referencia='simposio2026';")
    for row_number, (direction, category, activity) in GENERAL.items():
        for m in range(1, 10):
            value = amount(annual[0][row_number].get(chr(65 + m)))
            if value <= 0:
                continue
            key = f"anual2026:geral:linha{row_number}:mes{m:02d}"
            link_course = "(SELECT id FROM public.cursos WHERE codigo='capacitacao_obreiros')" if activity == "capacitacao_obreiros" else "NULL"
            link_event = "v_e" if activity == "simposio" else "NULL"
            sql.append(f"INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,categoria_id,curso_id,edicao_simposio_id,descricao,origem,origem_referencia,conciliacao_status) VALUES({literal(direction)},{value},NULL,{literal(month(m))},{literal(month(m))},'mes',(SELECT id FROM public.categorias_financeiras WHERE nome={literal(category)} AND tipo={literal(direction)}),{link_course},{link_event},{literal('Histórico mensal agregado; dia desconhecido')},'legado',{literal(key)},'provisorio') ON CONFLICT DO NOTHING;")
    for row_number in list(range(7, 19)) + list(range(19, 33)):
        row = event.get(row_number, {})
        description = row.get("A", "").strip()
        if not description:
            continue
        value = amount(row.get("B") if row_number < 19 else row.get("C"))
        kind = "receita_detalhe" if row_number < 19 and value > 0 else "doacao_bem_servico" if row_number < 19 else "despesa_detalhe"
        key = f"simposio2026:linha{row_number}"
        sql.append(f"INSERT INTO public.itens_simposio(edicao_id,descricao,tipo,valor,origem_referencia,contabilizado) VALUES(v_e,{literal(description)},{literal(kind)},{literal(value) if value > 0 else 'NULL'},{literal(key)},false) ON CONFLICT DO NOTHING;")
    for key, description, anual, detalhe in [
        ("simposio2026:entradas", "Simpósio 2026: entradas entre anual e detalhe", Decimal("10970"), Decimal("11480")),
        ("simposio2026:saidas", "Simpósio 2026: saídas entre anual e detalhe", Decimal("8015.43"), Decimal("8575.43")),
        ("anual2026:transporte:maio", "Saldo anterior de maio excede abril em R$ 2,00", Decimal("2"), Decimal("0")),
        ("anual2026:transporte:junho", "Saldo anterior de junho fica R$ 2,00 abaixo de maio", Decimal("-2"), Decimal("0")),
    ]:
        sql.append(f"INSERT INTO public.pendencias_conciliacao(chave,descricao,valor_anual,valor_detalhe) VALUES({literal(key)},{literal(description)},{anual},{detalhe}) ON CONFLICT DO NOTHING;")
    sql.append("END $its$;")
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(sql) + "\n", encoding="utf-8")
    print(f"Conferido: {len(students)} alunos, {value_cells} células, Teológico R$ 9.170,00; anual R$ {income}/{expense}; Simpósio R$ {event_income}/{event_expense}.")
    print(f"SQL gerado: {output} (contém dados pessoais; não versionar)")


if __name__ == "__main__":
    main()
