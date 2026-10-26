"""Integração local: não aceita destinos de produção e não usa credenciais reais."""
import faulthandler
faulthandler.dump_traceback_later(180, exit=True)
import json
import os
import uuid
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright, expect

API = "http://127.0.0.1:54321"
BASE = "http://127.0.0.1:8082"
SERVICE = os.environ["LOCAL_SERVICE_ROLE"]
EMAIL = f"central-{uuid.uuid4()}@example.invalid"
PASSWORD = str(uuid.uuid4())

def request(path, data):
    req = Request(API + path, data=json.dumps(data).encode(), headers={
        "apikey": SERVICE, "Authorization": "Bearer " + SERVICE,
        "Content-Type": "application/json", "Prefer": "return=representation"})
    with urlopen(req) as response:
        return json.load(response)

user = request("/auth/v1/admin/users", {"email": EMAIL, "password": PASSWORD, "email_confirm": True})
request("/rest/v1/user_roles", {"user_id": user["id"], "role": "admin"})

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(BASE + "/painel/login")
    page.get_by_label("E-mail").fill(EMAIL)
    page.get_by_label("Senha").fill(PASSWORD)
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_url(BASE + "/painel")
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", name="Dashboard", exact=True)).to_be_visible()
    for route, heading in [("/painel/atendimento", "Inscrições"), ("/painel/financeiro", "Financeiro"),
                           ("/painel/instituto", "Instituto"), ("/painel/relatorios", "Relatórios")]:
        page.goto(BASE + route)
        page.wait_for_load_state("networkidle")
        expect(page.get_by_role("heading", name=heading, exact=True)).to_be_visible()
        assert "Falha ao carregar" not in page.locator("body").inner_text()
    page.goto(BASE + "/painel/financeiro")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Nova movimentação").click()
    page.wait_for_load_state("networkidle")
    dialog = page.get_by_role("dialog")
    print("PASS navegação", flush=True)
    marker = "E2E local " + str(uuid.uuid4())
    dialog.locator("#mov-categoria").select_option(label="Ofertas ITS / Patrocínio")
    dialog.locator("#mov-valor").fill("25")
    dialog.locator("#mov-descricao").fill(marker)
    # Uma atualização em segundo plano não pode apagar dados digitados.
    with page.expect_response(lambda r: "/rest/v1/lancamentos_financeiros" in r.url, timeout=40000):
        pass
    expect(dialog.locator("#mov-valor")).to_have_value("25")
    expect(dialog.locator("#mov-descricao")).to_have_value(marker)
    with page.expect_response(lambda r: "/rpc/executar_movimento_its" in r.url) as saved:
        dialog.get_by_role("button", name="Registrar movimento").click()
    print("Resposta gravação", saved.value.status, flush=True)
    assert saved.value.ok, saved.value.text()
    movement_id = saved.value.json()
    expect(dialog).not_to_be_visible()
    row = page.get_by_role("row").filter(has_text=marker)
    expect(row).to_have_count(1)
    row.get_by_role("button", name="Editar movimento " + movement_id).click()
    page.get_by_role("dialog").locator("#mov-valor").fill("30")
    page.get_by_role("button", name="Salvar alterações").click()
    expect(page.get_by_role("dialog")).not_to_be_visible()
    expect(row).to_contain_text("30,00")
    row.get_by_role("button", name="Devolver movimento " + movement_id).click()
    page.locator("#dev-valor").fill("10")
    page.locator("#dev-categoria").select_option(index=1)
    page.get_by_role("button", name="Registrar saída").click()
    expect(page.get_by_role("dialog")).not_to_be_visible()
    print("PASS entrada edição devolução", flush=True)
    # Falha após dados válidos: preserva os registros e bloqueia decisões.
    page.route("**/rest/v1/lancamentos_financeiros*", lambda route: route.abort())
    page.evaluate("window.dispatchEvent(new Event('offline')); window.dispatchEvent(new Event('online'))")
    expect(page.get_by_text("Falha ao atualizar.", exact=False)).to_be_visible(timeout=40000)
    expect(row).to_be_visible()
    row.get_by_role("button", name="Editar movimento " + movement_id).click()
    expect(page.get_by_role("dialog")).not_to_be_visible()
    print("PASS falha", flush=True)
    page.unroute("**/rest/v1/lancamentos_financeiros*")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.goto(BASE + "/painel/inscricoes")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Nova inscrição").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_label("Nome completo").fill(marker)
    # CPF sintético com dígitos verificadores válidos, apenas no banco local.
    digits = [int(c) for c in str(uuid.uuid4().int)[:9]]
    for size in (9, 10):
        d = (sum(digits[n] * (size + 1 - n) for n in range(size)) * 10) % 11
        digits.append(0 if d == 10 else d)
    dialog.get_by_label("CPF", exact=True).fill("".join(map(str, digits)))
    dialog.get_by_label("Nascimento").fill("1990-01-01")
    dialog.get_by_label("Telefone").fill("11999999999")
    dialog.get_by_label("E-mail", exact=True).fill(EMAIL)
    dialog.get_by_label("Escolaridade").fill("medio")
    dialog.get_by_label("Atividade", exact=True).select_option(label="Curso Teológico")
    dialog.get_by_label("Núcleo", exact=True).select_option(label="Engenho Novo")
    dialog.get_by_role("button", name="Criar inscrição").click()
    expect(page.get_by_role("button", name="Confirmar inscrição", exact=True)).to_be_visible()
    page.get_by_role("button", name="Confirmar inscrição", exact=True).click()
    expect(page.get_by_role("button", name="Confirmar inscrição", exact=True)).not_to_be_visible()
    expect(page.get_by_role("dialog")).to_contain_text("Nenhum valor recebido ou devolvido")
    page.goto(BASE + "/painel/relatorios")
    page.wait_for_load_state("networkidle")
    with page.expect_popup() as printed:
        page.get_by_role("button", name="Imprimir ou salvar em PDF").click()
    report = printed.value
    expect(report.locator("header img")).to_be_visible()
    expect(report.locator("body")).to_contain_text("1º Tesoureiro")
    assert "Gerado em" not in report.locator("body").inner_text()
    assert "Conferência interna" not in report.locator("body").inner_text()
    report.close()
    page.get_by_role("button", name="Sair do painel").click()
    page.wait_for_url(BASE + "/painel/login")
    page.goto(BASE + "/painel/financeiro")
    page.wait_for_url(BASE + "/painel/login")
    assert not errors, errors
    browser.close()
    print("PASS: cinco áreas, atualização preserva formulário, entrada, edição, devolução, falha bloqueia decisão, inscrição e confirmação sem pagamento, impressão e logout")
