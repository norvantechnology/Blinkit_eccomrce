# User Web App (Next.js)

Customer storefront — **Tapi Grocery** brand with **Blinkit-parity UI**.  
**Milestone 1: CLOSED.** Catalogue / cart → Milestone 2.

> Spec: [`../Blinkit.md`](../Blinkit.md) **v2.6** — §5A / §19A / §21.5A  
> Audit: [`../MILESTONE_1_AUDIT.md`](../MILESTONE_1_AUDIT.md)

## Quick start

```bash
# From repo root — API must be running on :4000
cd user-web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Milestone 1 features (implemented)

| Feature | Route / component | Spec |
|---------|-------------------|------|
| Home shell (header, location, search, footer) | `/` | §19A |
| Phone OTP + email login | `/login`, `LoginModal` | §19A.1 / §8.1 |
| Account dropdown (My Account menu) | `ProfileButton` | §19A.2 |
| Account sidebar shell | `/account/*` + `AccountSidebar` | §19A.2 / §19A.8 |
| **My Addresses** list | `/account/addresses` | §19A.2 / §8.3 |
| **Enter complete address** modal (map + form) | `AddressModal` | §19A.2 / §8.3 |
| Account privacy (profile, language, delete) | `/account/settings` | §8.1 / §8.3 |
| Session refresh | `SessionKeepAlive` + axios interceptor | §7.1 |

`/account` redirects to `/account/addresses`.

### Address modal fields (Blinkit match)

- Left: map search, pin, “Go to current location”, “Delivering your order to”
- Right: Save as **Home / Work / Hotel / Other**, flat, floor, area, landmark, name, phone, **Save Address**
- API `label`: `home` \| `work` \| `other` — UI **Hotel** saves as `other`
- Without `MAPS_API_KEY`: manual area + OpenStreetMap embed + browser GPS

## Test credentials

**Email (after seed):** `rahul@example.com` / `Customer@123`

**OTP:** Set `OTP_TEST_CODE=123456` in `backend/.env`, or read the code from the API server console (`[DEV OTP]` log).

## Env

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |
| `BACKEND_URL` | `http://localhost:4000` |

## Out of scope for M1

Catalogue shelves, search results, PDP, cart ADD, checkout, orders — **Milestone 2+**.
