#!/usr/bin/env python3
"""
Blinkit login parity capture — download HTML/CSS/JS/fonts/icons once, extract offline.

Usage:
  python3 tools/blinkit-login-capture/capture.py
  python3 tools/blinkit-login-capture/capture.py --extract-only   # reuse out/ cache
  python3 tools/blinkit-login-capture/capture.py --apply          # copy CSS + icons into user-web

Why: avoid re-fetching live Blinkit on every chat turn (saves tokens / time).
Assets land in tools/blinkit-login-capture/out/ for offline matching.
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
)

# Wayback snapshot known to include login styled-components + main.css
WAYBACK_TS = "20260814115632"
WAYBACK_ID = f"https://web.archive.org/web/{WAYBACK_TS}id_/https://blinkit.com"

# Multi-page HTML for header/footer/account/categories parity
CAPTURE_PAGES = {
    "home": "/",
    "account": "/account",
    "addresses": "/account/addresses",
    "orders": "/account/orders",
    "categories": "/categories",
}

LOGIN_CSS_SELECTORS = [
    "login-help",
    "login-phone",
    "login-form",
    "login-head",
    "login__",
    "modal-content--login",
    "modal-overlay--login",
    "otp",
    "weight--semibold",
    "center-aligned",
    ".input,.textarea",
    "ReactModal__Body",
]

STYLED_NAMES = [
    "LoginModal__BackIcon",
    "LoginSteps__LoginWrapper",
    "PhoneNumberLogin__Links",
    "PhoneNumberLogin__LoginContainer",
    "PhoneNumberLogin__ImageContainer",
    "PhoneNumberLogin__LinksWrapper",
    "PhoneNumberLogin__LoginButton",
    "OtpVerification__BackIcon",
]


def http_get(url: str, dest: Path | None = None, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    if data[:2] == b"\x1f\x8b":
        try:
            data = gzip.decompress(data)
        except OSError:
            pass
    if dest:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    return data


def try_fetch(url: str, dest: Path) -> bool:
    try:
        print(f"  GET {url}")
        http_get(url, dest)
        print(f"    -> {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"    FAIL: {exc}")
        return False


def capture() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for sub in ("html", "css", "js", "fonts", "icons", "extracted"):
        (OUT / sub).mkdir(exist_ok=True)

    print("== Capture Blinkit assets (multi-page) ==")
    for name, path in CAPTURE_PAGES.items():
        try_fetch(f"{WAYBACK_ID}{path}", OUT / "html" / f"blinkit-{name}.html")

    html = ""
    home = OUT / "html" / "blinkit-home.html"
    if home.exists():
        html = home.read_text(errors="ignore")

    css_hrefs = sorted(set(re.findall(r'href=["\']/([^"\']+\.css)["\']', html)))
    js_srcs = sorted(
        set(
            re.findall(r'src=["\']/([^"\']+\.js)["\']', html)
            + re.findall(r'["\']([0-9]+\.scripts/[^"\']+\.js)["\']', html)
            + re.findall(r'["\'](scripts/[^"\']+\.js)["\']', html)
        )
    )

    # Always try known hashes from Aug 2026 snapshot
    css_hrefs = list(
        dict.fromkeys(
            css_hrefs
            + [
                "main.becde68a991f66f3cf61.css",
                "main-.becde68a991f66f3cf61.css",
                "vendor.becde68a991f66f3cf61.css",
            ]
        )
    )
    js_srcs = list(
        dict.fromkeys(
            js_srcs
            + [
                "scripts/main.becde68a991f66f3cf61.js",
                "7225.scripts/layout.e83ab3a001bba003e015.js",
            ]
        )
    )

    for href in css_hrefs:
        name = href.replace("/", "_")
        try_fetch(f"{WAYBACK_ID}/{href}", OUT / "css" / name)

    for src in js_srcs:
        name = src.replace("/", "_")
        try_fetch(f"{WAYBACK_ID}/{src}", OUT / "js" / name)

    # Icon font (wasabicons — used as CustomFont-style icons on Blinkit web)
    try_fetch(f"{WAYBACK_ID}/ba5446f12c7c87b3a16a.woff2", OUT / "fonts" / "wasabicons.woff2")
    try_fetch(f"{WAYBACK_ID}/492035d6714cf7043a98.woff", OUT / "fonts" / "wasabicons.woff")

    # Account sidebar IconFont (profile-nav my-address / my-orders / logout glyphs)
    try_fetch(
        "https://cdn.grofers.com/assets/web/assets/iconfont.woff2",
        OUT / "fonts" / "iconfont.woff2",
    )
    try_fetch(
        "https://cdn.grofers.com/assets/web/assets/newiconfont.woff2",
        OUT / "fonts" / "newiconfont.woff2",
    )

    capture_okra_fonts()

    # App logo used in login modal
    try_fetch(
        "https://cdn.grofers.com/layout-engine/2023-11/app_logo.svg",
        OUT / "icons" / "blinkit-app-logo.svg",
    )
    # Wayback fallback for logo
    if not (OUT / "icons" / "blinkit-app-logo.svg").exists() or (
        OUT / "icons" / "blinkit-app-logo.svg"
    ).stat().st_size < 100:
        try_fetch(
            f"https://web.archive.org/web/{WAYBACK_TS}id_/"
            "https://cdn.grofers.com/layout-engine/2023-11/app_logo.svg",
            OUT / "icons" / "blinkit-app-logo.svg",
        )

    meta = {
        "wayback_ts": WAYBACK_TS,
        "css_files": [p.name for p in (OUT / "css").glob("*.css")],
        "js_files": [p.name for p in (OUT / "js").glob("*.js")],
        "fonts": [str(p.relative_to(OUT / "fonts")) for p in (OUT / "fonts").rglob("*") if p.is_file()],
        "icons": [p.name for p in (OUT / "icons").glob("*")],
    }
    (OUT / "manifest.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("Wrote", OUT / "manifest.json")


# Blinkit Okra faces used on login (title = weight 800)
OKRA_CDN = "https://cdn.grofers.com/assets/web/assets"
OKRA_FILES = [
    # (url, local filename under fonts/okra/)
    (f"{OKRA_CDN}/Okra-Thin.woff2", "Okra-Thin.woff2"),
    (f"{OKRA_CDN}/Okra-Regular.woff2", "Okra-Regular.woff2"),
    (f"{OKRA_CDN}/Okra-Medium.woff2", "Okra-Medium.woff2"),
    (f"{OKRA_CDN}/Okra-Bold.woff2", "Okra-Bold.woff2"),
    # Hashed Blinkit.com faces for 600 / 800 (login-head__text uses 800)
    ("https://blinkit.com/a91215876706bcf068bb.woff2", "Okra-SemiBold-600.woff2"),
    ("https://blinkit.com/699d7150b2ec7cdc41ed.woff2", "Okra-ExtraBold-800.woff2"),
]


def capture_okra_fonts() -> None:
    """Download Okra woff2 files (title font for 'India's last minute app')."""
    print("== Capture Okra font files ==")
    okra_dir = OUT / "fonts" / "okra"
    okra_dir.mkdir(parents=True, exist_ok=True)
    for url, name in OKRA_FILES:
        dest = okra_dir / name
        ok = try_fetch(url, dest)
        if not ok or dest.stat().st_size < 1000:
            # Wayback fallback
            if url.startswith("https://blinkit.com/"):
                wb = f"{WAYBACK_ID}/{url.split('/')[-1]}"
            else:
                wb = f"https://web.archive.org/web/{WAYBACK_TS}id_/{url}"
            try_fetch(wb, dest)
        # validate woff2 magic
        if dest.exists() and dest.read_bytes()[:4] != b"wOF2":
            print(f"    WARN: {name} does not look like woff2")


def extract_okra_font_css(all_css: str) -> str:
    """Pull @font-face Okra rules from vendor.css and rewrite src to local files."""
    faces = re.findall(r"@font-face\s*\{[^}]*Okra[^}]*\}", all_css, flags=re.I)
    # De-dupe
    seen: set[str] = set()
    unique: list[str] = []
    for f in faces:
        if f not in seen:
            seen.add(f)
            unique.append(f)

    # Build clean local CSS (parity paths under /blinkit-parity/fonts/okra/)
    local = """/* Blinkit Okra — extracted from vendor.css @font-face (login title uses weight 800) */
/* Files: tools/blinkit-login-capture/out/fonts/okra/ → user-web/public/blinkit-parity/fonts/okra/ */

@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-Thin.woff2") format("woff2");
  font-style: normal;
  font-weight: 200;
  font-display: swap;
}
@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-Regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-Medium.woff2") format("woff2");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-SemiBold-600.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-Bold.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: "Okra";
  src: url("/blinkit-parity/fonts/okra/Okra-ExtraBold-800.woff2") format("woff2");
  font-style: normal;
  font-weight: 800;
  font-display: swap;
}

/* Named families also present on Blinkit */
@font-face {
  font-family: "Okra-Regular";
  src: url("/blinkit-parity/fonts/okra/Okra-Regular.woff2") format("woff2");
  font-style: normal;
  font-weight: normal;
  font-display: swap;
}
@font-face {
  font-family: "Okra-Medium";
  src: url("/blinkit-parity/fonts/okra/Okra-Medium.woff2") format("woff2");
  font-style: normal;
  font-weight: normal;
  font-display: swap;
}
@font-face {
  font-family: "Okra-Bold";
  src: url("/blinkit-parity/fonts/okra/Okra-Bold.woff2") format("woff2");
  font-style: normal;
  font-weight: normal;
  font-display: swap;
}
"""
    # Also save raw extracted faces for reference
    raw_path = OUT / "extracted" / "okra-font-face-raw.css"
    raw_path.write_text("\n\n".join(unique) + "\n" if unique else "/* none found — run full capture */\n")
    print(f"  okra-font-face-raw.css ({len(unique)} @font-face rules)")
    return local


def _unescape_css_str(s: str) -> str:
    try:
        return bytes(s, "utf-8").decode("unicode_escape")
    except Exception:
        return s.replace("\\n", "\n").replace("\\t", "\t")


def extract_styled_css(js_text: str) -> dict[str, str]:
    found: dict[str, str] = {}
    for name in STYLED_NAMES:
        idx = js_text.find(f'displayName:"{name}"')
        if idx < 0:
            continue
        start = js_text.find("([", idx)
        if start < 0:
            continue
        i = start + 1
        depth = 0
        end = None
        for j in range(i, min(i + 8000, len(js_text))):
            if js_text[j] == "[":
                depth += 1
            elif js_text[j] == "]":
                depth -= 1
                if depth == 0:
                    end = j
                    break
        if end is None:
            continue
        body = js_text[i + 1 : end]
        strs = re.findall(r'"((?:\\.|[^"\\])*)"', body)
        css = "".join(_unescape_css_str(s) for s in strs)
        # Document known interpolations for PhoneNumberLogin button/container
        if name == "PhoneNumberLogin__LoginButton":
            css = (
                "margin-top:18px;border:none;color:#fff;border-radius:12px;outline:none;"
                "font-family:inherit;font-size:14px;text-align:center;padding:16px;"
                "font-weight:500;min-height:50px;flex:0 1 auto;"
                "/* width: mobile 100% / desktop 300px */"
                "/* background: valid #0c831f / else #9C9C9C */"
            )
        if name == "PhoneNumberLogin__LoginContainer":
            css = (
                "z-index:1000;display:flex;justify-content:flex-start;flex-direction:column;"
                "gap:15px;width:100%;background-color:#fff;box-sizing:border-box;"
                "align-items:center;"
                "/* padding-top: mobile 10px / desktop 20px */"
                "/* desktop: max-height:100%;height:100% */"
                "/* mobile: position:absolute;bottom:0; box-shadow white */"
            )
        found[name] = css
    return found


def extract_global_login_css(all_css: str) -> str:
    rules: list[str] = []
    buf = ""
    for ch in all_css:
        buf += ch
        if ch == "}":
            low = buf.lower()
            if any(s.lower() in low for s in LOGIN_CSS_SELECTORS):
                rules.append(buf.strip())
            buf = ""
    # de-dupe while preserving order
    seen: set[str] = set()
    out: list[str] = []
    for r in rules:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return "\n\n".join(out) + "\n"


def extract_back_icon_svg(font_path: Path, dest: Path) -> bool:
    try:
        from fontTools.ttLib import TTFont
        from fontTools.pens.svgPathPen import SVGPathPen
    except ImportError:
        print("  fonttools not installed — pip install fonttools brotli")
        return False

    font = TTFont(str(font_path))
    cmap = font.getBestCmap() or {}
    # Prefer Blinkit wasabicons "back" glyph (shaft + chevron) — login CustomFont "&"
    glyph = "back"
    if glyph not in font.getGlyphOrder():
        print("  no 'back' glyph in font")
        return False

    glyph_set = font.getGlyphSet()
    pen = SVGPathPen(glyph_set)
    glyph_set[glyph].draw(pen)
    path = pen.getCommands()
    g = font["glyf"][glyph]
    # Font Y-up → SVG Y-down
    height = g.yMax - g.yMin
    svg = f"""<!-- Extracted from Blinkit wasabicons.woff2 glyph "back" (U+E923) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g.xMax} {height}" width="20" height="20" aria-hidden="true">
  <g transform="translate(0 {g.yMax}) scale(1 -1)">
    <path fill="currentColor" d="{path}"/>
  </g>
</svg>
"""
    dest.write_text(svg)
    # also write codepoint map snippet
    rev = {v: k for k, v in cmap.items()}
    meta = {
        "glyph": glyph,
        "codepoints": [hex(cp) for gname, cp in ((glyph, rev.get(glyph)),) if cp],
        "login_button_char_in_blinkit_js": "&",
        "login_button_font_family": "CustomFont (same icon set as wasabicons back)",
        "svg": str(dest.relative_to(ROOT)),
    }
    (OUT / "extracted" / "back-icon-meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"  Wrote {dest.relative_to(ROOT)}")
    return True


def extract_footer_from_html() -> None:
    """Pull FooterLinks / DownloadAndFollowRow styled CSS from captured home HTML."""
    home = OUT / "html" / "blinkit-home.html"
    if not home.exists():
        print("  skip footer — html/blinkit-home.html missing")
        return
    text = home.read_text(errors="ignore")
    hashes = [
        "hyzNyz",
        "aonOx",
        "fBgyNM",
        "jqmuYk",
        "BvTiN",
        "flTNGy",
        "bZlgle",
        "iZBVAQ",
        "cwIfVL",
        "hnVuxl",
        "gyBsbb",
        "kfNqsf",
        "bLeZQJ",
        "cPxShR",
        "jgvGfq",
        "iSSvsj",
        "hOxyYr",
        "csBNXw",
        "cDPZaQ",
        "kymqhZ",
        "lilmRt",
    ]
    lines = [
        "/* Auto-extracted from blinkit-home.html styled-components (footer) */",
        "",
    ]
    for h in hashes:
        for m in re.finditer(rf"\.{h}\{{([^{{}}]+)\}}", text):
            lines.append(f".{h} {{{m.group(1)}}}")
    for m in re.finditer(
        r"@media[^{]+\{(?:[^{}]|\.(?:hyzNyz|csBNXw|iZBVAQ|cwIfVL)\{[^{}]*\})+\}",
        text,
    ):
        block = m.group(0)
        if any(x in block for x in ("hyzNyz", "csBNXw", "iZBVAQ", "cwIfVL", "hnVuxl")):
            lines.append(block)
    dest = OUT / "extracted" / "footer-exact-from-blinkit.css"
    dest.write_text("\n".join(lines) + "\n")
    print(f"  footer-exact-from-blinkit.css ({dest.stat().st_size} bytes)")

    # Keep curated parity CSS if already authored in user-web
    curated = ROOT.parents[1] / "user-web" / "styles" / "blinkit-footer.css"
    if curated.exists():
        (OUT / "extracted" / "blinkit-footer.css").write_text(curated.read_text())
        print("  blinkit-footer.css (synced from user-web)")


def extract() -> None:
    print("== Extract login CSS / icons from out/ cache ==")
    css_parts: list[str] = []
    for p in sorted((OUT / "css").glob("*.css")):
        css_parts.append(p.read_text(errors="ignore"))
    all_css = "\n".join(css_parts)
    login_css = extract_global_login_css(all_css)
    (OUT / "extracted" / "login-global.css").write_text(login_css)
    print(f"  login-global.css ({len(login_css)} chars)")

    styled: dict[str, str] = {}
    for p in sorted((OUT / "js").glob("*.js")):
        styled.update(extract_styled_css(p.read_text(errors="ignore")))
    (OUT / "extracted" / "login-styled.json").write_text(json.dumps(styled, indent=2) + "\n")
    # Also emit a CSS file mapping component classes (without styled hashes)
    lines = [
        "/* Auto-extracted from Blinkit layout.js styled-components */",
        "/* Hash suffixes (sc-*) omitted — use stable BEM displayNames */",
        "",
    ]
    for name, css in styled.items():
        cls = name  # e.g. PhoneNumberLogin__LoginButton
        lines.append(f".{cls} {{")
        for part in css.split(";"):
            part = part.strip()
            if part and not part.startswith("/*"):
                lines.append(f"  {part};")
            elif part.startswith("/*"):
                lines.append(f"  {part}")
        lines.append("}")
        lines.append("")
    (OUT / "extracted" / "login-styled.css").write_text("\n".join(lines) + "\n")
    print(f"  login-styled.css ({len(styled)} components)")

    font = OUT / "fonts" / "wasabicons.woff2"
    if font.exists():
        extract_back_icon_svg(font, OUT / "icons" / "back-icon.svg")
    else:
        print("  skip back icon — fonts/wasabicons.woff2 missing (run capture first)")

    okra_css = extract_okra_font_css(all_css)
    (OUT / "extracted" / "okra-fonts.css").write_text(okra_css)
    print(f"  okra-fonts.css ({len(okra_css)} chars)")

    extract_footer_from_html()

    # Reference HTML snippet for phone login (from layout.js strings)
    snippet = """<!-- Blinkit phone login DOM (from live JS) -->
<div class="ReactModal__Content modal-content--login" role="dialog" aria-modal="true">
  <button class="LoginModal__BackIcon" aria-label="Close Login Box">&amp;</button>
  <div class="LoginSteps__LoginWrapper login center-aligned">
    <div class="login__body">
      <div class="PhoneNumberLogin__LoginContainer">
        <div class="PhoneNumberLogin__ImageContainer">
          <div class="ZImage__Container" style="height:64px;width:64px">
            <img class="ZImage__img" alt="Blinkit Image" src="…/app_logo.svg" width="64" height="64"/>
          </div>
        </div>
        <div class="login-help weight--semibold">
          <div>
            <div class="login-head__text">India's last minute app</div>
            <div class="login-help weight--semibold">Log in or Sign up</div>
          </div>
        </div>
        <form class="login-form">
          <div class="login-phone">
            <input type="tel" maxlength="10" class="login-phone__input input" placeholder="Enter mobile number"/>
          </div>
          <button class="PhoneNumberLogin__LoginButton">Continue</button>
        </form>
        <div class="PhoneNumberLogin__LinksWrapper">
          <span>By continuing, you agree to our&nbsp;</span>
          <a class="PhoneNumberLogin__Links" href="/terms">Terms of service</a>
          <span>&nbsp;&amp;&nbsp;</span>
          <a class="PhoneNumberLogin__Links" href="/privacy">Privacy policy</a>
        </div>
      </div>
    </div>
  </div>
</div>
"""
    (OUT / "extracted" / "login-dom.html").write_text(snippet)
    print("  login-dom.html")

    # Icons + font sizes + padding tokens (header + login)
    try:
        from extract_tokens import run as extract_tokens_run

        extract_tokens_run()
    except ImportError:
        # running as script from another cwd
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "extract_tokens", ROOT / "extract_tokens.py"
        )
        mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        assert spec and spec.loader
        spec.loader.exec_module(mod)
        mod.run()


def apply_to_user_web() -> None:
    """Copy extracted fonts/icons into user-web for offline parity."""
    print("== Apply captured fonts/icons into user-web ==")
    uw = ROOT.parents[1] / "user-web"
    public = uw / "public" / "blinkit-parity"
    public.mkdir(parents=True, exist_ok=True)
    fonts_dest = public / "fonts" / "okra"
    fonts_dest.mkdir(parents=True, exist_ok=True)

    src_back = OUT / "icons" / "back-icon.svg"
    if src_back.exists():
        dest = public / "login-back.svg"
        dest.write_text(src_back.read_text())
        print(f"  {dest.relative_to(uw.parent)}")

    src_font = OUT / "fonts" / "wasabicons.woff2"
    if src_font.exists():
        dest_f = public / "wasabicons.woff2"
        dest_f.write_bytes(src_font.read_bytes())
        print(f"  {dest_f.relative_to(uw.parent)}")

    okra_src = OUT / "fonts" / "okra"
    if okra_src.is_dir():
        for p in sorted(okra_src.glob("*.woff2")):
            dest = fonts_dest / p.name
            dest.write_bytes(p.read_bytes())
            print(f"  {dest.relative_to(uw.parent)} ({dest.stat().st_size} bytes)")

    okra_css = OUT / "extracted" / "okra-fonts.css"
    if okra_css.exists():
        dest_css = public / "okra-fonts.css"
        dest_css.write_text(okra_css.read_text())
        # Also mirror into user-web/styles for easy @import
        styles = uw / "styles" / "okra-fonts.css"
        styles.write_text(okra_css.read_text())
        print(f"  {styles.relative_to(uw.parent)}")

    # Tokens + chrome CSS + icons
    styles_dir = uw / "styles"
    for name in ("blinkit-tokens.css", "blinkit-chrome.css", "blinkit-footer.css", "blinkit-pages.css"):
        src = OUT / "extracted" / name
        if src.exists():
            (styles_dir / name).write_text(src.read_text())
            print(f"  styles/{name}")

    # Prefer live user-web pages CSS if extract cache missing curated file
    pages_uw = styles_dir / "blinkit-pages.css"
    if pages_uw.exists():
        (OUT / "extracted" / "blinkit-pages.css").write_text(pages_uw.read_text())

    icons_dest = public / "icons"
    icons_dest.mkdir(parents=True, exist_ok=True)
    for p in sorted((OUT / "icons").glob("*.svg")):
        (icons_dest / p.name).write_bytes(p.read_bytes())
        print(f"  public/blinkit-parity/icons/{p.name}")

    # Account IconFont (profile-nav)
    fonts_public = public / "fonts"
    fonts_public.mkdir(parents=True, exist_ok=True)
    for name in ("iconfont.woff2", "newiconfont.woff2"):
        src = OUT / "fonts" / name
        if src.exists():
            (fonts_public / name).write_bytes(src.read_bytes())
            print(f"  public/blinkit-parity/fonts/{name}")
    iconfont_css = OUT / "extracted" / "iconfont-account.css"
    if iconfont_css.exists():
        (styles_dir / "blinkit-iconfont.css").write_text(iconfont_css.read_text())
        print("  styles/blinkit-iconfont.css")

    footer_icons = public / "icons" / "footer"
    footer_icons.mkdir(parents=True, exist_ok=True)
    for name in (
        "facebook.svg",
        "x.svg",
        "instagram.svg",
        "linkedin.svg",
        "threads.svg",
        "app-store.svg",
        "google-play.svg",
        "social-0.svg",
        "social-1.svg",
        "social-2.svg",
        "social-3.svg",
        "social-threads.svg",
    ):
        src = OUT / "icons" / name
        if not src.exists():
            continue
        # Normalize social-N → named footer icons when present
        dest_name = {
            "social-0.svg": "facebook.svg",
            "social-1.svg": "x.svg",
            "social-2.svg": "instagram.svg",
            "social-3.svg": "linkedin.svg",
            "social-threads.svg": "threads.svg",
        }.get(name, name)
        (footer_icons / dest_name).write_bytes(src.read_bytes())
        print(f"  public/blinkit-parity/icons/footer/{dest_name}")

    tokens_json = OUT / "extracted" / "design-tokens.json"
    if tokens_json.exists():
        (public / "design-tokens.json").write_text(tokens_json.read_text())

    ref = OUT / "extracted" / "READY_FOR_USER_WEB.md"
    ref.write_text(
        """# How to use this capture

1. `python3 tools/blinkit-login-capture/capture.py` — download + extract
2. `--extract-only` — rebuild from `out/` cache (no network)
3. `--apply` — copy into user-web:
   - `styles/okra-fonts.css`, `blinkit-tokens.css`, `blinkit-chrome.css`
   - `public/blinkit-parity/fonts/okra/*`
   - `public/blinkit-parity/icons/*` (back, search, cart, profile, …)
4. Read `out/extracted/TOKENS.md` for font sizes / padding / icons cheat sheet
5. Login: `styles/blinkit-login.css` · Header: `styles/blinkit-chrome.css` + Okra
"""
    )
    print(f"  Wrote {ref.relative_to(ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Capture Blinkit login HTML/CSS/icons for offline parity")
    ap.add_argument("--extract-only", action="store_true", help="Skip download; extract from out/")
    ap.add_argument("--apply", action="store_true", help="Copy icons into user-web/public/blinkit-parity")
    ap.add_argument("--skip-extract", action="store_true", help="Only download")
    args = ap.parse_args()

    if not args.extract_only:
        capture()
    if not args.skip_extract:
        extract()
    if args.apply:
        apply_to_user_web()
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
