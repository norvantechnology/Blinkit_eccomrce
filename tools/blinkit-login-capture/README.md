# Blinkit login + header capture (offline parity)

Captures Blinkit **HTML/CSS/JS**, **Okra fonts**, **icons**, and a clear **token sheet** (font sizes + padding) so we do not re-scrape every chat.

## Run

```bash
python3 tools/blinkit-login-capture/capture.py              # download + extract
python3 tools/blinkit-login-capture/capture.py --extract-only
python3 tools/blinkit-login-capture/capture.py --extract-only --apply
```

## Clear token docs

After extract, open:

- `out/extracted/TOKENS.md` — font sizes, padding, icons table
- `out/extracted/design-tokens.json` — machine-readable
- `out/extracted/blinkit-tokens.css` — CSS variables (`--bk-fs-*`, `--bk-pad-*`, …)

## Applied into user-web (`--apply`)

| Asset | Path |
|-------|------|
| Okra fonts | `public/blinkit-parity/fonts/okra/` |
| Icons (back, search, cart, profile, …) | `public/blinkit-parity/icons/` |
| `@font-face` | `styles/okra-fonts.css` |
| CSS vars | `styles/blinkit-tokens.css` |
| Header chrome | `styles/blinkit-chrome.css` |

Header + login UI read these tokens (86px / 68px header, Okra 24/800 title, 20px back icon, etc.).

## Footer parity

After capture, also read:

- `out/extracted/FOOTER_STRUCTURE.md`
- `out/extracted/footer-exact-from-blinkit.css`
- `out/extracted/blinkit-footer.css` → applied as `user-web/styles/blinkit-footer.css`

Footer uses Blinkit grid `1fr 2fr`, Okra 18/600 headings, 14px links (`gap:12` / `column-gap:24`), band `#fcfcfc` with 40px social icons + 92×30 store badges.

## Full spacing / pages

- `out/extracted/SPACING.md` — header/footer/account/home padding & breakpoints
- `out/extracted/account-from-main.css` — classic account CSS from Blinkit main.css
- `out/extracted/all-styled-components.css` — multi-page styled dump
- `out/extracted/blinkit-pages.css` → `user-web/styles/blinkit-pages.css`

Capture pulls **home, account, addresses, orders, categories** HTML (Wayback). Blinkit is React (not jQuery); parity comes from HTML + CSS + JS styled-components.
