"""Parcours authentifiés (portail membre, administration, plateforme).

Nécessite des identifiants fournis par variables d'environnement :
  E2E_EMAIL / E2E_PASSWORD           (compte à tester)
  E2E_ROLE                           membre | administrateur | super_admin

Les identifiants ne sont ni journalisés ni visibles dans les captures.
Lancement :  E2E_EMAIL=... E2E_PASSWORD=... python e2e/run_authenticated.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from harness import (  # noqa: E402
    BASE_URL,
    VIEWPORT,
    Recorder,
    click_check,
    mark_spa,
    save,
    shot,
    summarize,
    visit,
)
from routes import ADMIN_ROUTES, MEMBER_ROUTES, PLATFORM_ROUTES  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

EMAIL = os.environ.get("E2E_EMAIL")
PASSWORD = os.environ.get("E2E_PASSWORD")
ROLE = os.environ.get("E2E_ROLE", "administrateur")


async def login(page) -> bool:
    await page.goto(f"{BASE_URL}/auth", wait_until="domcontentloaded")
    await page.wait_for_timeout(1000)
    await page.locator("input[type='email']").first.fill(EMAIL)
    await page.locator("input[type='password']").first.fill(PASSWORD)
    await page.get_by_role("button", name="Se connecter").first.click()
    try:
        await page.wait_for_url("**/dashboard**", timeout=20000)
    except Exception:  # noqa: BLE001
        return False
    await page.wait_for_timeout(1500)
    return True


async def main() -> None:
    if not EMAIL or not PASSWORD:
        print("E2E_EMAIL / E2E_PASSWORD absents : parcours authentifiés non exécutés.")
        sys.exit(2)

    checks = []
    routes = list(MEMBER_ROUTES)
    if ROLE in ("administrateur", "super_admin"):
        routes += ADMIN_ROUTES
    if ROLE == "super_admin":
        routes += PLATFORM_ROUTES

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT)
        page = await context.new_page()
        rec = Recorder(page)

        if not await login(page):
            print("Connexion impossible avec les identifiants fournis.")
            await shot(page, "auth_echec")
            await browser.close()
            sys.exit(1)
        await shot(page, "auth_ok")

        for module, name, path in routes:
            await visit(rec, module, name, path, checks)
            slug = path.strip("/").replace("/", "_")
            await shot(page, f"auth_{slug}")

            # Sur chaque écran : ouverture/fermeture d'un dialogue principal
            # si un bouton d'action est présent, sans action destructive.
            await mark_spa(page)
            for label in ("Nouveau", "Ajouter", "Créer", "Nouvelle"):
                btn = page.get_by_role("button", name=label, exact=False).first
                if await btn.count():
                    await click_check(rec, module, name, f"Bouton « {label} »", btn, checks)
                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(500)
                    break

        # Contrôle d'accès : route réservée → page « Accès refusé », pas de page blanche.
        await visit(rec, "Contrôle d'accès", "Route réservée", "/dashboard/admin/platform/associations", checks)
        await visit(rec, "Contrôle d'accès", "Route inconnue du portail", "/dashboard/route-inexistante", checks)

        await browser.close()

    path = save(checks, "authenticated.json")
    print("Résultats:", path)
    for c in checks:
        print(f"[{c.state}] {c.module} / {c.page} / {c.action} — {c.issue}")
    print("Synthèse:", summarize(checks))


asyncio.run(main())
