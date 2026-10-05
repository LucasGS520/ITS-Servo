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
    console_errors: list[str] = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

    page.goto(f"{BASE_URL}/painel/login")
    page.wait_for_load_state("networkidle")
    assert_heading(page, "Painel Operacional")
    page.get_by_label("E-mail").fill(ADMIN_EMAIL)
    page.get_by_label("Senha").fill(ADMIN_PASSWORD)
    page.get_by_role("button", name="Entrar").click()
    page.wait_for_url(f"{BASE_URL}/painel")
    page.wait_for_load_state("networkidle")
    assert_heading(page, "Dashboard")

    routes = {
        "/painel/participantes": "Participantes",
        "/painel/matriculas": "Matrículas",
        "/painel/cursos": "Cursos",
        "/painel/simposios": "Simpósios",
        "/painel/financeiro?tab=cobrancas": "Registro Financeiro",
        "/painel/auditoria": "Auditoria",
    }
    for route, heading in routes.items():
        page.goto(f"{BASE_URL}{route}")
        page.wait_for_load_state("networkidle")
        assert_heading(page, heading)

    page.goto(f"{BASE_URL}/painel/cursos")
    page.get_by_role("button", name="Editar curso").first.click()
    assert_heading(page, "Editar curso")
    page.get_by_role("button", name="Cancelar").click()

    desktop = Path(gettempdir()) / "central-dashboard-desktop.png"
    page.goto(f"{BASE_URL}/painel")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(desktop), full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/painel/matriculas")
    page.wait_for_load_state("networkidle")
    assert_heading(page, "Matrículas")
    body_width = page.evaluate("document.body.scrollWidth")
    assert body_width <= 390, f"Overflow horizontal da página: {body_width}px"
    mobile = Path(gettempdir()) / "central-matriculas-mobile.png"
    page.screenshot(path=str(mobile), full_page=True)

    assert not console_errors, f"Erros no console: {console_errors}"
    print(f"desktop={desktop}")
    print(f"mobile={mobile}")
    print("e2e-smoke=ok")
    browser.close()
