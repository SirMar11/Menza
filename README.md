# 🍽️ Menza — simulace objednávkového systému

Semestrální práce pro předměty **Základy v Reactu** a **Základy Node.js**. Simuluje objednávkový systém menzy — uživatelé si mohou prohlédnout jídelníček, filtrovat jídla podle dne a stravovacích preferencí, nabít si kredit a objednávat. Celé to běží real-time — když někdo objedná, ostatní to vidí ihned jako toast notifikaci.
Projekt je záměrně zjednodušený a přímočarý.

---

## Co aplikace umí

- **Jídelníček** — provizorní menu na každý pracovní den s filtrováním podle štítků (vegan, vegetarián, bez lepku)
- **Uživatelský profil** — registrace, přihlášení, zobrazení aktuálního kreditu
- **Nabíjení kreditu** — simulace dobití peněz na účet (záporné nebo nulové částky jsou blokovány)
- **Nákup jídel** — odečtení kreditu při objednávce, ochrana proti nedostatku kreditu
- **Historie objednávek** — přehled co jsi kdy objednal/a s celkovou útratou, progressive disclosure (zpočátku jen 5)
- **Real-time notifikace** — WebSocket broadcast, každý připojený uživatel vidí objednávky ostatních živě
- **Dark mode** — přepínání light/dark s pamětí v localStorage, respektuje systémové nastavení OS

---

## Stack

### Backend

| Technologie           | K čemu                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| **Node.js**           | runtime                                                                    |
| **Hono**              | webový framework — routes, middleware, CORS, cookie helpers                |
| **Drizzle ORM**       | typově bezpečná práce s databází, schema jako TypeScript                   |
| **better-sqlite3**    | synchronní SQLite driver, celá DB je jeden soubor `menza.db`               |
| **Drizzle Kit**       | CLI pro správu DB schématu (`db:push`)                                     |
| **Zod**               | validace vstupů z requestů                                                 |
| **@hono/node-ws**     | WebSocket podpora pro Node.js adapter                                      |
| **crypto (built-in)** | hashování hesel — PBKDF2 s 100k iteracemi + salt, žádné externí závislosti |

### Frontend

| Technologie             | K čemu                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| **React 19**            | UI komponenty                                                     |
| **TypeScript**          | typová bezpečnost všude                                           |
| **Vite**                | bundler + dev server s HMR                                        |
| **React Router DOM v7** | klientské routování mezi záložkami                                |
| **TanStack Query**      | server state management — cache, refetch, loading/error stavy     |
| **Hono RPC client**     | typově bezpečná volání API generovaná ze serverového AppType      |
| **Tailwind CSS v4**     | utility-first stylování s CSS custom properties pro design tokeny |

### Testování

| Technologie                | K čemu                                                 |
| -------------------------- | ------------------------------------------------------ |
| **AVA**                    | backend testy, striktní TDD přístup                    |
| **Vitest**                 | frontend testy                                         |
| **@testing-library/react** | renderování a interakce s React komponentami v testech |
| **jsdom**                  | simulace prohlížeče v Node.js prostředí                |

---

## Struktura projektu

```
├── server/                  # Backend (Node.js + Hono)
│   ├── auth/
│   │   └── hash.ts          # Crypto logika — hashPassword, verifyHash, generateToken
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema — users, menuItems, orders
│   │   ├── index.ts         # Instance DB připojení
│   │   ├── users.ts         # DB operace pro uživatele
│   │   ├── orders.ts        # Logika nákupu s transakcí
│   │   ├── seed.ts          # Seed data — 15 jídel na celý týden
│   │   └── types.ts         # Sdílený typ AppDb
│   ├── middleware/
│   │   └── auth.ts          # loadUser (všechny routes) + requireAuth (chráněné routes)
│   ├── routes/
│   │   ├── auth.ts          # POST /auth/register, /login, /logout
│   │   ├── menu.ts          # GET /menu/list s filtrováním
│   │   └── user.ts          # GET /user/me, POST /topup, /orders, GET /orders
│   ├── index.ts             # Entry point — Hono app, WebSocket, seed
│   └── ws.ts                # WebSocket broadcast manager
│
├── src/                     # Frontend (React + TypeScript)
│   ├── components/
│   │   └── Divider.tsx      # Sdílená UI komponenta
│   ├── context/
│   │   └── ThemeContext.tsx  # Dark mode — Context API
│   ├── features/
│   │   ├── menu/            # Záložka Jídelníček
│   │   │   ├── MenuPage.tsx
│   │   │   └── MenuItemCard.tsx
│   │   ├── user/            # Záložka Uživatel
│   │   │   ├── UserPage.tsx
│   │   │   ├── AuthForm.tsx (inline v UserPage)
│   │   │   ├── UserCard.tsx
│   │   │   ├── TopUpForm.tsx
│   │   │   └── OrderHistory.tsx
│   │   └── tests/
│   │       └── UserPage.test.tsx  # Integrační test AuthForm
│   ├── hooks/
│   │   └── useOrderNotifications.ts  # WS klient s auto-reconnect
│   ├── lib/
│   │   ├── client.ts        # Hono RPC klient
│   │   ├── config.ts        # API_URL, WS_URL — přepsatelné přes .env
│   │   └── utils.ts         # getCurrentDay helper
│   └── App.tsx              # Root — providery, header, routing
│
├── tests/                   # Backend AVA testy
│   ├── helpers.ts           # Sdílená makeDb() factory
│   ├── auth.test.ts
│   ├── topup.test.ts
│   └── order.test.ts
│
├── drizzle.config.ts        # Konfigurace Drizzle Kit
└── menza.db                 # SQLite databáze (generuje se automaticky)
```

---

## Prerekvizity

- **Node.js 18+** — projekt používá ESM, top-level `await` a `tsx` v4, starší verze nebudou fungovat
- **npm** — přichází s Node.js, žádná extra instalace

---

## Jak to rozjet

### 1. Klonování repa a instalace závislostí

```bash
git clone <url>
cd react-node
npm install
```

### 2. Vytvoření databáze

```bash
npm run db:push
```

Tohle vytvoří soubor `menza.db` s celým schématem. Seed data (jídla na celý týden) se načtou automaticky při prvním startu serveru.

### 3. Spuštění backendu a frontendu

**dva terminály** — backend a frontend běží odděleně:

```bash
# Terminál 1 — backend (port 3000)
npm run server:dev

# Terminál 2 — frontend (port 5173)
npm run dev
```

Frontend je na `http://localhost:5173`, backend API na `http://localhost:3000`.

### 4. Real-time notifikace

2 okna prohlížeče — jedno normální, jedno incognito (nebo jiný prohlížeč). Po registraci/přihlášení v každém jako jiný uživatel a po nákupu jídla se objeví toast notifikace o nákupu v obou oknech.

---

## Spuštění testů

```bash
# Backend testy (AVA) — 8 testů
npm test

# Frontend testy (Vitest) — 3 testy
npm run test:fe
```

---

## Proměnné prostředí

Pro lokální vývoj není potřeba nic nastavovat. Pokud chceš přepsat URL na jiný server:

```env
# .env (vytvoř v kořeni projektu)
VITE_API_URL=https://tvoje-api.example.com
VITE_WS_URL=wss://tvoje-api.example.com/ws
```

---

## Autentizace — jak to funguje pod kapotou

Hesla se **nikdy neukládají v čitelné podobě**. Při registraci se vygeneruje náhodný `salt` (32 bajtů), heslo se zahashuje pomocí `PBKDF2-SHA512` se 100 000 iteracemi a výsledek se uloží do DB. Při přihlášení se celý výpočet zopakuje a porovná.

Session funguje přes `httpOnly` cookie s náhodným tokenem (32 bajtů). Každý request ho middleware ověří proti DB a vloží uživatele do kontextu.

---

## Dostupné příkazy

| Příkaz               | Co dělá                                       |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Spustí Vite dev server (frontend)             |
| `npm run server:dev` | Spustí Hono server s auto-restartem (backend) |
| `npm run db:push`    | Synchronizuje Drizzle schema do SQLite        |
| `npm test`           | Spustí AVA backend testy                      |
| `npm run test:fe`    | Spustí Vitest frontend testy                  |
| `npm run build`      | Produkční build frontendu                     |
| `npm run lint`       | Spustí ESLint                                 |
