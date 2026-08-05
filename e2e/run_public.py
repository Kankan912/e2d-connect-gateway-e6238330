"""Parcours publics : accueil, don, adhésion, slug, 404, écran de connexion.

Lancement :  python e2e/run_public.py
"""

from __future__ import annotations

import asyncio
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
from routes import PUBLIC_ROUTES  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402


async def main() -> None:
    checks = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT)
        page = await context.new_page()
        rec = Recorder(page)

        for module, name, path in PUBLIC_ROUTES:
            await visit(rec, module, name, path, checks)
            await shot(page, f"public_{path.strip('/').replace('/', '_') or 'accueil'}")

        # Navigation interne depuis l'accueil : aucun rechargement attendu.
        await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        await mark_spa(page)
        for label, href, expect in (
            ("Lien Faire un don", "a[href$='/don']", "/don"),
            ("Lien Adhésion", "a[href$='/adhesion']", "/adhesion"),
        ):
            loc = page.locator(href).first
            if await loc.count():
                await click_check(rec, "Site public", "Accueil", label, loc, checks, expect_url=expect)
                await page.go_back()
                await page.wait_for_timeout(800)
                await mark_spa(page)

        # Écran de connexion : soumission avec des identifiants invalides
        # (le formulaire vide est bloqué par la validation native du navigateur).
        await page.goto(f"{BASE_URL}/auth", wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        await page.locator("input[type='email']").first.fill("e2e-inconnu@example.invalid")
        await page.locator("input[type='password']").first.fill("mot-de-passe-invalide")
        await mark_spa(page)
        submit = page.get_by_role("button", name="Se connecter").first
        if await submit.count():
            await click_check(
                rec, "Authentification", "Connexion", "Soumission identifiants invalides", submit, checks
            )
        await shot(page, "auth_identifiants_invalides")


        await browser.close()

    path = save(checks, "public.json")
    print("Résultats:", path)
    for c in checks:
        print(f"[{c.state}] {c.module} / {c.page} / {c.action} — {c.issue}")
    print("Synthèse:", summarize(checks))


asyncio.run(main())
