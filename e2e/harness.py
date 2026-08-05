"""Harnais Playwright partagé pour les parcours E2E.

Détecte, pour chaque navigation ou action :
  - les rechargements complets de page (perte d'état SPA) ;
  - les pages blanches (racine React vide) ;
  - les erreurs console et les erreurs JavaScript non capturées ;
  - les requêtes réseau en échec (>= 400 ou requête avortée).

Aucun identifiant n'est journalisé ni capturé dans les captures d'écran.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

BASE_URL = os.environ.get("E2E_BASE_URL", "http://localhost:8080")
OUT_DIR = Path(os.environ.get("E2E_OUT_DIR", "/tmp/browser/e2e"))
SHOTS = OUT_DIR / "screenshots"
VIEWPORT = {"width": 1280, "height": 1800}

# Bruit réseau non bloquant (analytics, ressources externes optionnelles).
IGNORED_REQUEST_FRAGMENTS = ("/rest/v1/pageviews", "favicon", "fonts.gstatic")
# Avertissements console connus et sans impact fonctionnel.
IGNORED_CONSOLE_FRAGMENTS = (
    "Download the React DevTools",
    "React Router Future Flag",
    "[vite]",
)


@dataclass
class Check:
    module: str
    page: str
    action: str
    state: str = "Fonctionnel"
    issue: str = ""
    console_errors: list[str] = field(default_factory=list)
    network_errors: list[str] = field(default_factory=list)
    reloaded: bool = False
    blank: bool = False

    def fail(self, state: str, issue: str) -> "Check":
        self.state = state
        self.issue = issue
        return self


class Recorder:
    """Attache les écouteurs à une page et accumule les anomalies."""

    def __init__(self, page):
        self.page = page
        self.console: list[str] = []
        self.network: list[str] = []
        page.on("console", self._on_console)
        page.on("pageerror", lambda e: self.console.append(f"pageerror: {e}"))
        page.on("requestfailed", self._on_request_failed)
        page.on("response", self._on_response)

    def _on_console(self, msg) -> None:
        if msg.type != "error":
            return
        text = msg.text
        if any(f in text for f in IGNORED_CONSOLE_FRAGMENTS):
            return
        self.console.append(text)

    def _on_request_failed(self, request) -> None:
        if any(f in request.url for f in IGNORED_REQUEST_FRAGMENTS):
            return
        self.network.append(f"{request.method} {request.url} (échec réseau)")

    def _on_response(self, response) -> None:
        if response.status < 400:
            return
        if any(f in response.url for f in IGNORED_REQUEST_FRAGMENTS):
            return
        self.network.append(f"{response.status} {response.url}")

    def drain(self) -> tuple[list[str], list[str]]:
        c, n = self.console[:], self.network[:]
        self.console.clear()
        self.network.clear()
        return c, n


RELOAD_MARKER = "__e2e_spa_marker"


async def mark_spa(page) -> None:
    """Pose un marqueur détruit par tout rechargement complet du document."""
    await page.evaluate(f"window.{RELOAD_MARKER} = true")


async def spa_intact(page) -> bool:
    return bool(await page.evaluate(f"!!window.{RELOAD_MARKER}"))


async def is_blank(page) -> bool:
    return bool(
        await page.evaluate(
            "(() => { const r = document.getElementById('root');"
            " return !r || r.innerText.trim().length === 0; })()"
        )
    )


async def visit(rec: Recorder, module: str, page_name: str, path: str, checks: list[Check]) -> Check:
    """Navigation directe (URL) : contrôle page blanche, console et réseau."""
    check = Check(module=module, page=page_name, action=f"Ouverture {path}")
    page = rec.page
    rec.drain()
    try:
        await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(1500)
    except Exception as exc:  # noqa: BLE001
        check.fail("Non fonctionnel", f"Navigation impossible : {exc}")
        checks.append(check)
        return check

    check.blank = await is_blank(page)
    check.console_errors, check.network_errors = rec.drain()
    if check.blank:
        check.fail("Non fonctionnel", "Page blanche (racine React vide)")
    elif check.console_errors:
        check.fail("Partiellement fonctionnel", "Erreur console : " + check.console_errors[0][:180])
    elif check.network_errors:
        check.fail("Partiellement fonctionnel", "Requête en échec : " + check.network_errors[0][:180])
    checks.append(check)
    await mark_spa(page)
    return check


async def click_check(
    rec: Recorder,
    module: str,
    page_name: str,
    label: str,
    locator,
    checks: list[Check],
    expect_url: str | None = None,
) -> Check:
    """Clic sur un élément : contrôle rechargement, page blanche, effet visible."""
    check = Check(module=module, page=page_name, action=label)
    page = rec.page
    rec.drain()
    await mark_spa(page)
    before_html_len = len(await page.content())
    before_url = page.url
    try:
        await locator.click(timeout=8000)
        await page.wait_for_timeout(1200)
    except Exception as exc:  # noqa: BLE001
        check.fail("Non fonctionnel", f"Clic impossible : {exc}")
        checks.append(check)
        return check

    check.reloaded = not await spa_intact(page)
    check.blank = await is_blank(page)
    check.console_errors, check.network_errors = rec.drain()
    after_html_len = len(await page.content())
    url_changed = page.url != before_url

    if check.blank:
        check.fail("Non fonctionnel", "Page blanche après le clic")
    elif check.reloaded:
        check.fail("Partiellement fonctionnel", "Rechargement complet de la page")
    elif expect_url and expect_url not in page.url:
        check.fail("Non fonctionnel", f"Redirection incorrecte : {page.url}")
    elif check.console_errors:
        check.fail("Partiellement fonctionnel", "Erreur console : " + check.console_errors[0][:180])
    elif not url_changed and abs(after_html_len - before_html_len) < 20:
        check.fail("Partiellement fonctionnel", "Aucun effet visible (bouton potentiellement inerte)")
    checks.append(check)
    return check


def not_verified(module: str, page_name: str, action: str, reason: str) -> Check:
    return Check(module=module, page=page_name, action=action, state="Non vérifié", issue=reason)


async def shot(page, name: str) -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(SHOTS / f"{name}.png"))


def save(checks: list[Check], filename: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = OUT_DIR / filename
    target.write_text(json.dumps([asdict(c) for c in checks], ensure_ascii=False, indent=2))
    return target


def summarize(checks: list[Check]) -> dict[str, Any]:
    counts: dict[str, int] = {}
    for c in checks:
        counts[c.state] = counts.get(c.state, 0) + 1
    return counts
