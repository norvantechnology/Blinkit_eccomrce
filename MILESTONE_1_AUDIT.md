# Milestone 1 — Final Audit & Closeout

**Audit date:** 2026-08-08  
**Spec:** [`Blinkit.md`](./Blinkit.md) **v2.6** (§21)  
**Verdict:** **Milestone 1 COMPLETE** for local/dev scope — ready for **Milestone 2**  
**Deferred (non-blocking):** [`DO_THAT_LATER.md`](./DO_THAT_LATER.md)

---

## Executive verdict

| Layer | M1 scope | Status |
|-------|----------|--------|
| Database §6.1–§6.2 | 10 tables + PostGIS GIST | **Pass** |
| API §8.1–§8.3 + admin auth §8.2 | Auth, profile, addresses, admin login | **Pass** (Apple/Firebase = intentional 501) |
| Admin panel | Auth shell + RBAC PermissionGate | **Pass** (CRUD UI → M4) |
| User web §19A.1–§19A.2 | Auth + Blinkit chrome + account/addresses | **Pass** |
| Tests | 6 integration tests | **Pass** (2026-08-08) |
| AWS VPC/RDS §3 | Production infra | **Deferred** (host DB OK for M1) |

**Phase 2 starts next** — catalog, search, cart, wishlist (§6.3–§6.4, §8.4–§8.6, §19A.3–§19A.5).

---

## 1. Backend checklist

### 1.1 Database (§6.1–§6.2)

| Table | Status |
|-------|--------|
| `stores`, `store_settings` | Done + seeded (Tapi Grocery / `blinkit-store`) |
| `users`, `otp_verifications`, `user_devices` | Done (`refresh_token_hash` on devices) |
| `addresses` | Done + PostGIS `location` + GIST |
| `admin_users`, `roles`, `permissions`, `role_permissions` | Done |
| `audit_logs` | Done (purge by age; partitioning → M5) |

### 1.2 User auth API (§8.1)

| Endpoint | Status |
|----------|--------|
| `POST /auth/otp/send`, `/otp/verify` | Done |
| `POST /auth/register`, `/login/email` | Done |
| `POST /auth/oauth/google` | Done (needs `GOOGLE_CLIENT_ID`) |
| `POST /auth/oauth/apple`, `/firebase/verify` | Stub **501** (intentional) |
| `POST /auth/refresh-token`, `/logout` | Done |
| `DELETE /auth/account` | Done |

### 1.3 Admin auth API (§8.2)

| Endpoint | Status |
|----------|--------|
| login / refresh / logout | Done |
| forgot-password / reset-password | Done |

### 1.4 Profile & addresses (§8.3)

| Endpoint | Status |
|----------|--------|
| `GET/PATCH /users/me`, `PATCH /users/me/language` | Done |
| `GET/POST/PATCH/DELETE /addresses` | Done |
| `PATCH /addresses/:id/default` | Done |
| `GET /addresses/search?q=` | Done (**503** without `MAPS_API_KEY`) |

### 1.5 Integration tests (2026-08-08)

```
PASS  Auth OTP → verify → tokens
PASS  Refresh token rotation
PASS  Google OAuth find-or-create
PASS  Admin forgot → reset → login
PASS  RBAC super_admin → permissions
PASS  RBAC support_agent → 403
```

**6/6 passed.**

---

## 2. Admin panel checklist (M1)

| Feature | Status |
|---------|--------|
| Login / forgot / reset | Done |
| JWT + cookie session + auto refresh | Done |
| RBAC sidebar + `PermissionGate` | Done |
| Dashboard / module pages | Placeholder → **M4** |
| API docs proxy `:3000/api-docs` | Done |

---

## 3. User web checklist (M1 / §19A.1–§19A.2)

| Feature | Route / component | Status |
|---------|-------------------|--------|
| Full-width desktop header (Blinkit) | `Header.tsx` | Done |
| Mobile header (location + profile + search) | `Header.tsx` | Done |
| **No mobile bottom tab bar** | — | Done (removed; not on Blinkit web) |
| Location bar + ETA | `LocationBar.tsx` | Done |
| Account dropdown | `ProfileButton.tsx` | Done |
| OTP + email login | `/login`, `LoginModal` | Done |
| Account hub (Your Information) | `/account` | Done |
| Desktop account sidebar | `AccountSidebar` | Done |
| My Addresses list + ⋮ menu | `/account/addresses` | Done |
| Desktop address modal (map + form) | `AddressModal` | Done |
| Mobile: confirm pin → bottom sheet form | `AddressModal` | Done |
| Account privacy | `/account/settings` | Done |
| Home shell (banners + category grid) | `/` | Done (ADD/shelves → M2) |
| Typography | Plus Jakarta Sans (Okra substitute) | Done |
| Brand | Tapi Grocery | Done |

**Out of M1 (correctly absent):** product catalog APIs, cart ADD, search results, checkout, orders, wallet.

---

## 4. Intentional deviations (carry forward)

1. Apple / Firebase auth → `501` until client chooses path  
2. AWS VPC/RDS → host `DATABASE_URL` for now  
3. Admin §19 CRUD → Milestone 4  
4. Hotel UI tag → API `other`  
5. Address modal name/phone = UX prefills (not address columns)  
6. Maps autocomplete needs `MAPS_API_KEY`; UI fallback = manual + GPS + OSM  
7. Brand wordmark **Tapi Grocery** (allowed §19A difference)  
8. Font: Plus Jakarta Sans instead of proprietary Okra  

Optional keys: [`DO_THAT_LATER.md`](./DO_THAT_LATER.md).

---

## 5. How to run (local)

| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Admin | http://localhost:3000 |
| User web | http://localhost:3001 |

| App | Credentials |
|-----|-------------|
| Admin | `admin@gmail.com` / `admin@123` |
| User email | `rahul@example.com` / `Customer@123` |
| OTP | `OTP_TEST_CODE` (e.g. `123456`) |

---

## 6. Milestone 2 kickoff (next)

Do **not** expand M1 further. Start M2 from [`Blinkit.md`](./Blinkit.md) §21.9:

1. Catalog schema §6.3 + seed products/categories  
2. Product/search APIs §8.4–§8.5  
3. Cart/wishlist §8.6  
4. User web: home shelves, category listing, PDP, cart UI (§19A.3–§19A.5)  
5. Admin catalog CRUD can wait until M4 unless needed for seeding via API  

---

## 7. Historical note

Earlier audit sections below (2026-08-06) documented pre-fix gaps. Those gaps were closed; this **Final Audit** is the current source of truth for M1 status.

---

# Original Milestone 1 Audit Report (2026-08-06)

**Audit date:** 2026-08-06  
**Spec reference:** `Blinkit.md` (v2.3 → later v2.5+)  
**Original auditor scope:** Verification only — no fixes applied  
**Post-fix update:** 2026-08-06 (gaps closed)  
**User Web M1 UI:** 2026-08-08  
**Final closeout:** 2026-08-08 (this file header)

> Prefer the **Final Audit** section at the top of this file for current status.
