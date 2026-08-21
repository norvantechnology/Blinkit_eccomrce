#!/usr/bin/env python3
"""
Extract clear Blinkit design tokens: icons, font sizes, padding, header + login.
Called from capture.py extract() / standalone:

  python3 tools/blinkit-login-capture/extract_tokens.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
EXTRACTED = OUT / "extracted"
ICONS = OUT / "icons"

# Measured / scraped from Blinkit main.css + styled-components (Aug 2026 snapshot)
DESIGN_TOKENS = {
    "meta": {
        "source": "blinkit.com vendor/main CSS + layout.js styled-components",
        "wayback_ts": "20260814115632",
    },
    "colors": {
        "brandYellow": "#F8CB46",
        "cartGreen": "#0C831F",
        "cartGreenHover": "#097019",
        "text": "#1F1F1F",
        "textDark": "#333333",
        "textMuted": "#363636",
        "textGray": "#666666",
        "placeholder": "#999999",
        "divider": "#EEEEEE",
        "dividerSoft": "#F2F2F2",
        "searchBg": "#F8F8F8",
        "searchBorder": "#E8E8E8",
        "headerHover": "#FCFCFC",
        "overlayLogin": "rgba(0,0,0,0.7)",
        "footerBand": "#FBFBFB",
        "disabledBtn": "#9C9C9C",
        "inputBorder": "#CCCCCC",
        "linkMuted": "#696969",
    },
    "fonts": {
        "family": "Okra",
        "fallback": "Okra, var(--font-okra), 'Plus Jakarta Sans', sans-serif",
        "weights": {
            "thin": 200,
            "regular": 400,
            "medium": 500,
            "semibold": 600,
            "bold": 700,
            "extrabold": 800,
        },
        "files": {
            "200": "Okra-Thin.woff2",
            "400": "Okra-Regular.woff2",
            "500": "Okra-Medium.woff2",
            "600": "Okra-SemiBold-600.woff2",
            "700": "Okra-Bold.woff2",
            "800": "Okra-ExtraBold-800.woff2",
        },
    },
    "fontSizes": {
        "loginTitle": {"size": "24px", "weight": 800, "color": "#333", "selector": ".login-head__text"},
        "loginSubtitle": {"size": "16px", "weight": 500, "lineHeight": "1.6", "color": "#333", "selector": ".login-help"},
        "loginInput": {"size": "14px", "weight": 600, "selector": ".login-phone__input"},
        "loginPlus91": {"size": "14px", "weight": 600, "color": "#333"},
        "loginButton": {"size": "14px", "weight": 500, "selector": ".PhoneNumberLogin__LoginButton"},
        "loginTerms": {"size": "12px", "color": "#696969", "selector": ".PhoneNumberLogin__LinksWrapper"},
        "headerLocationTitle": {"size": "16px", "weight": 800, "desktopSize": "18px"},
        "headerLocationSubtitle": {"size": "13px", "weight": 400, "color": "#000000", "mobileSize": "12px"},
        "headerProfile": {"size": "18px", "weight": 400, "color": "#363636", "family": "Okra-Regular"},
        "headerCartText": {"size": "14px", "weight": 700, "family": "Okra-Bold", "color": "#ffffff"},
        "headerCartIcon": {"size": "28px", "family": "CustomFont"},
        "searchPlaceholder": {"size": "14px", "color": "#999999"},
    },
    "spacing": {
        "headerHeightDesktop": "86px",
        "headerHeightMobile": "68px",
        "headerBorder": "1px solid #EEEEEE",
        "logoContainerWidth": "178px",
        "logoContainerHeight": "86px",
        "locationBarWidthDesktop": "320px",
        "locationBarPaddingMobile": "0 0 0 16px",
        "profileWidthDesktop": "162px",
        "cartButtonWidth": "112px",
        "cartButtonHeight": "52px",
        "cartButtonRadius": "8px",
        "verticalDivider": "1px solid #F2F2F2",
        "searchRadius": "12px",
        "loginModalRadius": "16px",
        "loginGap": "15px",
        "loginPaddingTopDesktop": "20px",
        "loginPaddingTopMobile": "10px",
        "loginFormMargin": "0 24px",
        "loginButtonMarginTop": "18px",
        "loginButtonMinHeight": "50px",
        "loginButtonWidthDesktop": "300px",
        "loginInputPadding": "15px 20px 15px 50px",
        "loginInputWidthDesktop": "220px",
        "loginBackIconPadding": "8px 10px",
        "loginBackIconOffset": {"left": "15px", "top": "15px"},
        "loginLinksPadding": "12px 0",
        "loginWidthDesktop": "570px",
        "breakpointMobile": "1020px",
    },
    "icons": {
        "back": {
            "blinkit": "CustomFont glyph '&'",
            "wasabiconsGlyph": "back",
            "codepoint": "U+E923",
            "file": "icons/back.svg",
            "size": "20px",
            "usedOn": ["LoginModal__BackIcon"],
        },
        "chevronDown": {
            "wasabiconsGlyph": "chevron-down",
            "file": "icons/chevron-down.svg",
            "size": "10px",
            "usedOn": ["LocationBar"],
        },
        "chevronLeft": {
            "wasabiconsGlyph": "chevron-left",
            "file": "icons/chevron-left.svg",
            "size": "20px",
            "usedOn": ["mobile back"],
        },
        "search": {
            "wasabiconsGlyph": "Search",
            "file": "icons/search.svg",
            "size": "20px",
            "usedOn": ["SearchBar", "mobile header"],
        },
        "cart": {
            "wasabiconsGlyph": "grocery-cart",
            "file": "icons/cart.svg",
            "size": "28px",
            "usedOn": ["CartButton"],
        },
        "profile": {
            "wasabiconsGlyph": "profile-user",
            "file": "icons/profile.svg",
            "size": "20px",
            "usedOn": ["mobile account"],
        },
        "appLogo": {
            "file": "icons/blinkit-app-logo.svg",
            "size": "64px",
            "radius": "16px",
            "usedOn": ["PhoneNumberLogin logo"],
        },
    },
}


HEADER_STYLED = [
    "Header__HeaderContainer",
    "Header__HeaderLeft",
    "Header__HeaderRight",
    "BlinkitLogo__LogoContainer",
    "LocationBar__Container",
    "LocationBar__Subtitle",
    "LocationBar__EtaContainer",
    "CartButton__Container",
    "CartButton__Button",
    "CartButton__Text",
    "CartButton__CartIcon",
    "ProfileButton__Container",
    "ProfileButton__Text",
    "LoginModal__BackIcon",
    "PhoneNumberLogin__LoginContainer",
    "PhoneNumberLogin__ImageContainer",
    "PhoneNumberLogin__LinksWrapper",
    "PhoneNumberLogin__LoginButton",
    "PhoneNumberLogin__Links",
]


def _decode_css_strs(body: str) -> str:
    strs = re.findall(r'"((?:\\.|[^"\\])*)"', body)
    try:
        return "".join(bytes(s, "utf-8").decode("unicode_escape") for s in strs)
    except Exception:
        return "".join(s.replace("\\n", "\n") for s in strs)


def extract_styled_by_names(js_text: str, names: list[str]) -> dict[str, str]:
    found: dict[str, str] = {}
    for name in names:
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
        found[name] = _decode_css_strs(js_text[i + 1 : end])
    return found


def export_wasabicons(glyph: str, dest: Path, size: int = 20) -> bool:
    try:
        from fontTools.ttLib import TTFont
        from fontTools.pens.svgPathPen import SVGPathPen
    except ImportError:
        print("  fonttools missing — skip icon", glyph)
        return False

    font_path = OUT / "fonts" / "wasabicons.woff2"
    if not font_path.exists():
        print("  wasabicons.woff2 missing")
        return False

    font = TTFont(str(font_path))
    if glyph not in font.getGlyphOrder():
        print(f"  glyph missing: {glyph}")
        return False

    glyph_set = font.getGlyphSet()
    pen = SVGPathPen(glyph_set)
    glyph_set[glyph].draw(pen)
    path = pen.getCommands()
    g = font["glyf"][glyph]
    height = g.yMax - g.yMin
    svg = f"""<!-- wasabicons:{glyph} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g.xMax} {height}" width="{size}" height="{size}" aria-hidden="true">
  <g transform="translate(0 {g.yMax}) scale(1 -1)">
    <path fill="#1F1F1F" d="{path}"/>
  </g>
</svg>
"""
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(svg)
    return True


def tokens_to_css(tokens: dict) -> str:
    c = tokens["colors"]
    s = tokens["spacing"]
    lines = [
        "/* Auto-generated by extract_tokens.py — Blinkit parity tokens */",
        "/* Do not edit by hand; re-run capture.py --extract-only */",
        "",
        ":root {",
        f"  --bk-yellow: {c['brandYellow']};",
        f"  --bk-green: {c['cartGreen']};",
        f"  --bk-green-hover: {c['cartGreenHover']};",
        f"  --bk-text: {c['text']};",
        f"  --bk-text-dark: {c['textDark']};",
        f"  --bk-text-muted: {c['textMuted']};",
        f"  --bk-text-gray: {c['textGray']};",
        f"  --bk-placeholder: {c['placeholder']};",
        f"  --bk-divider: {c['divider']};",
        f"  --bk-divider-soft: {c['dividerSoft']};",
        f"  --bk-search-bg: {c['searchBg']};",
        f"  --bk-search-border: {c['searchBorder']};",
        f"  --bk-header-hover: {c['headerHover']};",
        f"  --bk-overlay-login: {c['overlayLogin']};",
        f"  --bk-footer-band: {c['footerBand']};",
        f"  --bk-disabled: {c['disabledBtn']};",
        f"  --bk-input-border: {c['inputBorder']};",
        f"  --bk-link-muted: {c['linkMuted']};",
        "",
        f"  --bk-header-h: {s['headerHeightDesktop']};",
        f"  --bk-header-h-mobile: {s['headerHeightMobile']};",
        f"  --bk-logo-w: {s['logoContainerWidth']};",
        f"  --bk-location-w: {s['locationBarWidthDesktop']};",
        f"  --bk-profile-w: {s['profileWidthDesktop']};",
        f"  --bk-cart-w: {s['cartButtonWidth']};",
        f"  --bk-cart-h: {s['cartButtonHeight']};",
        f"  --bk-search-radius: {s['searchRadius']};",
        f"  --bk-login-w: {s['loginWidthDesktop']};",
        f"  --bk-login-gap: {s['loginGap']};",
        f"  --bk-login-radius: {s['loginModalRadius']};",
        f"  --bk-bp-mobile: {s['breakpointMobile']};",
        "",
        "  --bk-font: Okra, var(--font-okra), 'Plus Jakarta Sans', sans-serif;",
        "  --bk-fs-login-title: 24px;",
        "  --bk-fs-login-sub: 16px;",
        "  --bk-fs-login-input: 14px;",
        "  --bk-fs-login-btn: 14px;",
        "  --bk-fs-login-terms: 12px;",
        "  --bk-fs-loc-title: 16px;",
        "  --bk-fs-loc-title-lg: 18px;",
        "  --bk-fs-loc-sub: 13px;",
        "  --bk-fs-profile: 18px;",
        "  --bk-fs-cart: 14px;",
        "  --bk-fs-cart-icon: 28px;",
        "  --bk-icon-back: 20px;",
        "  --bk-icon-search: 20px;",
        "  --bk-icon-cart: 28px;",
        "  --bk-pad-login-top: 20px;",
        "  --bk-pad-login-top-m: 10px;",
        "  --bk-pad-back: 8px 10px;",
        "  --bk-pad-input: 15px 20px 15px 50px;",
        "  --bk-pad-links: 12px 0;",
        "  --bk-pad-form-x: 24px;",
        "}",
        "",
    ]
    return "\n".join(lines) + "\n"


def write_chrome_css() -> str:
    """Header chrome rules matching Blinkit styled-components measurements."""
    return """/* Blinkit header chrome — sizes from live styled-components */
/* Requires okra-fonts.css + blinkit-tokens.css (loaded via globals.css) */

.bk-header {
  font-family: var(--bk-font);
  background: #fff;
  border-bottom: 1px solid var(--bk-divider);
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
}

.bk-header__row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  height: var(--bk-header-h);
  width: 100%;
  background: #fff;
}

.bk-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--bk-header-h);
  width: var(--bk-logo-w);
  flex-shrink: 0;
}

.bk-logo:hover {
  background-color: var(--bk-header-hover);
}

.bk-divider-v {
  width: 1px;
  height: 40px;
  background: var(--bk-divider-soft);
  flex-shrink: 0;
}

.bk-location {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: var(--bk-header-h);
  width: var(--bk-location-w);
  padding-left: 12px;
  padding-right: 10px;
  cursor: pointer;
  font-size: var(--bk-fs-loc-title);
  flex-shrink: 0;
}

.bk-location:hover {
  background-color: var(--bk-header-hover);
}

.bk-location__title {
  font-family: var(--bk-font);
  font-size: var(--bk-fs-loc-title-lg);
  font-weight: 800;
  color: var(--bk-text);
  line-height: 1.2;
}

.bk-location__sub {
  font-family: var(--bk-font);
  font-size: var(--bk-fs-loc-sub);
  font-weight: 400;
  color: #000;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bk-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--bk-header-h);
  min-width: var(--bk-profile-w);
  cursor: pointer;
  font-family: Okra-Regular, var(--bk-font);
  font-size: var(--bk-fs-profile);
  font-weight: 400;
  color: var(--bk-text-muted);
  transition: background-color 0.5s;
  flex-shrink: 0;
  padding: 0 12px;
}

.bk-profile:hover {
  background-color: var(--bk-header-hover);
}

.bk-cart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--bk-header-h);
  margin-right: 32px;
  margin-left: 12px;
  flex-shrink: 0;
}

.bk-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--bk-cart-h);
  width: var(--bk-cart-w);
  border-radius: 8px;
  background: var(--bk-green);
  color: #fff;
  font-family: Okra-Bold, var(--bk-font);
  font-size: var(--bk-fs-cart);
  font-weight: 700;
  cursor: pointer;
}

.bk-cart.is-empty {
  background: #cccccc;
  opacity: 0.5;
  cursor: not-allowed;
}

.bk-cart__icon {
  font-size: var(--bk-fs-cart-icon);
  margin-right: 8px;
  line-height: 1;
}

@media screen and (max-width: 1020px) {
  .bk-header__row {
    height: auto;
    min-height: var(--bk-header-h-mobile);
  }
  .bk-location {
    height: var(--bk-header-h-mobile);
    width: auto;
    flex: 1;
    padding-left: 16px;
    align-items: flex-start;
  }
  .bk-location__title {
    font-size: var(--bk-fs-loc-title);
  }
  .bk-cart-wrap {
    margin-right: 12px;
    margin-left: 8px;
    height: var(--bk-header-h-mobile);
  }
}
"""


def run() -> None:
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)

    print("== Extract design tokens (icons / font sizes / padding) ==")
    (EXTRACTED / "design-tokens.json").write_text(json.dumps(DESIGN_TOKENS, indent=2) + "\n")
    print("  design-tokens.json")

    tokens_css = tokens_to_css(DESIGN_TOKENS)
    (EXTRACTED / "blinkit-tokens.css").write_text(tokens_css)
    print("  blinkit-tokens.css")

    chrome = write_chrome_css()
    (EXTRACTED / "blinkit-chrome.css").write_text(chrome)
    print("  blinkit-chrome.css")

    # Styled header/login snippets
    styled: dict[str, str] = {}
    for p in sorted((OUT / "js").glob("*.js")):
        styled.update(extract_styled_by_names(p.read_text(errors="ignore"), HEADER_STYLED))
    # Also scan /tmp fallback
    fallback = Path("/tmp/blinkit-js/7225.scripts_layout.e83ab3a001bba003e015.js")
    if fallback.exists() and len(styled) < 5:
        styled.update(extract_styled_by_names(fallback.read_text(errors="ignore"), HEADER_STYLED))

    (EXTRACTED / "header-login-styled.json").write_text(json.dumps(styled, indent=2) + "\n")
    lines = ["/* Header + login styled-components (extracted) */", ""]
    for name, css in sorted(styled.items()):
        lines.append(f"/* {name} */")
        lines.append(f".{name} {{ {css} }}")
        lines.append("")
    (EXTRACTED / "header-login-styled.css").write_text("\n".join(lines) + "\n")
    print(f"  header-login-styled.css ({len(styled)} rules)")

    # Icons
    icon_map = {
        "back": ("back", 20),
        "chevron-down": ("chevron-down", 10),
        "chevron-left": ("chevron-left", 20),
        "search": ("Search", 20),
        "cart": ("grocery-cart", 28),
        "profile": ("profile-user", 20),
    }
    for file_stem, (glyph, size) in icon_map.items():
        ok = export_wasabicons(glyph, ICONS / f"{file_stem}.svg", size)
        print(f"  icons/{file_stem}.svg {'OK' if ok else 'FAIL'}")

    # Human-readable cheat sheet
    sheet = EXTRACTED / "TOKENS.md"
    fs = DESIGN_TOKENS["fontSizes"]
    sp = DESIGN_TOKENS["spacing"]
    ic = DESIGN_TOKENS["icons"]
    sheet.write_text(
        f"""# Blinkit design tokens (captured)

## Header structure (exact)

See `HEADER_STRUCTURE.md` and `header-exact-from-blinkit.css`.

Desktop zones: **Left** (logo 178×86 | divider | location 320px) → **Search** (flex:1, h46) → **Right** (profile 162px | cart 112×52).
Breakpoints: **1020** mobile, **1260** large.

## Font sizes
| Token | Size | Weight | Where |
|-------|------|--------|-------|
| login title | {fs['loginTitle']['size']} | {fs['loginTitle']['weight']} | India's last minute app |
| login subtitle | {fs['loginSubtitle']['size']} | {fs['loginSubtitle']['weight']} | Log in or Sign up |
| login input / btn | {fs['loginInput']['size']} | 600 / 500 | phone + Continue |
| login terms | {fs['loginTerms']['size']} | 400 | footer links |
| location title | {fs['headerLocationTitle']['size']} → {fs['headerLocationTitle']['desktopSize']} | 800 | header |
| location sub | {fs['headerLocationSubtitle']['size']} | 400 | header |
| profile | {fs['headerProfile']['size']} | 400 | header |
| cart | {fs['headerCartText']['size']} | 700 | header |

## Padding / heights
| Token | Value |
|-------|-------|
| header desktop | {sp['headerHeightDesktop']} |
| header mobile | {sp['headerHeightMobile']} |
| login width | {sp['loginWidthDesktop']} |
| login gap | {sp['loginGap']} |
| login pad-top | {sp['loginPaddingTopDesktop']} / mobile {sp['loginPaddingTopMobile']} |
| back icon | pad {sp['loginBackIconPadding']}, offset {sp['loginBackIconOffset']} |
| input pad | {sp['loginInputPadding']} |
| button | min-h {sp['loginButtonMinHeight']}, mt {sp['loginButtonMarginTop']}, w {sp['loginButtonWidthDesktop']} |

## Icons
| Name | Glyph / file | Size |
|------|--------------|------|
| back | {ic['back']['wasabiconsGlyph']} → {ic['back']['file']} | {ic['back']['size']} |
| search | {ic['search']['wasabiconsGlyph']} | {ic['search']['size']} |
| cart | {ic['cart']['wasabiconsGlyph']} | {ic['cart']['size']} |
| profile | {ic['profile']['wasabiconsGlyph']} | {ic['profile']['size']} |
| logo | {ic['appLogo']['file']} | {ic['appLogo']['size']} |
"""
    )
    print("  TOKENS.md")

    # Prefer copying pre-dumped exact header CSS if present
    exact = EXTRACTED / "header-exact-from-blinkit.css"
    if exact.exists():
        print(f"  header-exact-from-blinkit.css ({exact.stat().st_size} bytes)")


if __name__ == "__main__":
    run()
