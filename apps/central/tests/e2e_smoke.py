"""Smoke test visual local. Requer Central e Supabase locais em execução."""

import os
from pathlib import Path
from tempfile import gettempdir
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("E2E_BASE_URL", "http://127.0.0.1:8080")
ADMIN_EMAIL = os.environ["E2E_ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["E2E_ADMIN_PASSWORD"]

def assert_heading(page, name: str) -> None:
    page.get_by_role("heading", name=name).wait_for(state="visible")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(f"{BASE_URL}/painel/login")
    page.get_by_label("E-mail").fill(ADMIN_EMAIL)
    page.get_by_label("Senha").fill(ADMIN_PASSWORD)
    page.get_by_role("button", name="Entrar").click()
    page.wait_for_url(f"{BASE_URL}/painel")
    assert_heading(page, "Dashboard")

    for route, heading in {
        "/painel/atendimento": "Inscrições",
        "/painel/financeiro?tab=lancamentos": "Financeiro",
        "/painel/instituto": "Instituto",
        "/painel/relatorios": "Relatórios",
    }.items():
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        assert_heading(page, heading)

    page.goto(f"{BASE_URL}/painel/matriculas")
    assert_heading(page, "Página não encontrada")
    assert not page.locator("a[href*='localhost:4321']").count()

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/painel/atendimento")
    page.wait_for_load_state("networkidle")
    assert page.evaluate("document.body.scrollWidth") <= 390
    screenshot = Path(gettempdir()) / "central-inscricoes-mobile.png"
    page.screenshot(path=str(screenshot), full_page=True)
    print(f"mobile={screenshot}")
    browser.close()
