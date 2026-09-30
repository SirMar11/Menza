# SRS: Curio, mobilní aplikace pro učení formou „reels“

> **Pracovní název:** Curio (lze později změnit)
> **Verze dokumentu:** 0.1 (návrh pro MVP)
> **Datum:** 2026-09-30
> **Typ dokumentu:** Software Requirements Specification (volně podle IEEE 830)

---

## 0. Pokyny pro implementaci (pro AI asistenta / vývojáře)

- Tento dokument je **jediný zdroj pravdy** o rozsahu MVP. Co tu není, se neimplementuje bez domluvy.
- Požadavky mají ID (`FR-…`, `NFR-…`) a prioritu podle **MoSCoW**:
  - **M** (Must): nutné pro MVP
  - **S** (Should): mělo by být v MVP, pokud to jde
  - **C** (Could): až po MVP
  - **W** (Won't): vědomě mimo rozsah
- Postupuj podle fází v kapitole [11. Plán implementace](#11-plán-implementace). Po každé fázi musí projít testy a lint.
- Ve všech vrstvách používej **TypeScript v režimu strict**. Doménové typy definuj **jednou** v `packages/shared` (Zod schémata) a všude je importuj. Nikde je neduplikuj.
- Texty UI piš **česky**, ale připrav je tak, aby šly později přeložit (texty drž v jednom modulu, ne rozházené po komponentách).

---

## 1. Úvod

### 1.1 Účel

Curio je mobilní aplikace, která učí zajímavá témata formou krátkých, vertikálně scrollovatelných „reels“ (inspirace TikTok / Instagram Reels). Místo videí používá **textově-vizuální karty**, které jsou navržené tak, aby udržely pozornost a zároveň podporovaly skutečné zapamatování (aktivní vybavování, opakování v intervalech).

### 1.2 Rozsah

MVP zahrnuje:
- mobilní aplikaci (iOS + Android, Expo / React Native),
- backend API (Hono + Drizzle + SQLite),
- sdílený balíček se schématy a typy,
- **vývojová seed data** (ručně připravená témata a reely).

Automatická tvorba obsahu (hybridní pipeline zdroj → AI → validace) **není součástí MVP**. Datový model s ní ale musí od začátku počítat (viz [kap. 10](#10-budoucí-rozšíření-obsahová-pipeline)).

### 1.3 Definice a pojmy

| Pojem | Význam |
|---|---|
| **Karta (Card)** | Jedna obrazovka obsahu (1–3 věty, případně interakce). Má svůj typ, např. hook, fakt, kvíz. |
| **Reel** | Krátký příběh o 3–7 kartách na jedno konkrétní téma. Základní jednotka feedu. |
| **Kategorie (Category)** | Hrubé rozdělení oboru (Věda, Historie…). Určuje barvu a ikonu. |
| **Téma (Topic)** | Konkrétnější oblast v kategorii (Astronomie, Starověk…). Uživatel si témata vybírá. |
| **Štítek (Tag)** | Volné jemné označení (#planety). Slouží k propojování a doporučování. |
| **Série (Series)** | Uspořádaná posloupnost reelů s progresem (např. „Sluneční soustava v 10 reelech“). |
| **Feed** | Nekonečný vertikální seznam reelů. |
| **Váha tématu** | Číslo 0,05–1 vyjadřující, jak moc uživatele téma zajímá. Mění se podle jeho chování. |
| **Opakování (Review)** | Návrat dříve viděného reelu formou rychlého kvízu (spaced repetition). |
| **Wildcard** | Reel z tématu, které si uživatel nevybral. Vkládá se do feedu kvůli objevování. |

### 1.4 Reference

- IEEE 830-1998: Recommended Practice for Software Requirements Specifications
- Leitnerův systém / spaced repetition
- Dokumentace: Expo, expo-router, React Native Reanimated, Hono, Drizzle ORM, Zod, TanStack Query

---

## 2. Celkový popis

### 2.1 Perspektiva produktu

Samostatná nová aplikace, která s ničím existujícím nesouvisí. Skládá se ze tří částí v jednom monorepu:

```
┌──────────────────┐      HTTPS/JSON       ┌──────────────────┐
│  apps/mobile     │  ───────────────────▶ │  apps/server     │
│  Expo + RN       │   Hono RPC klient     │  Hono + Drizzle  │
│                  │ ◀───────────────────  │  SQLite          │
└────────┬─────────┘                       └────────┬─────────┘
         │           ┌──────────────────┐           │
         └─────────▶ │ packages/shared  │ ◀─────────┘
                     │ Zod schémata,    │
                     │ typy, konstanty  │
                     └──────────────────┘
                     ┌──────────────────┐
                     │ packages/content │  seed data (JSON)
                     └──────────────────┘
```

### 2.2 Hlavní funkce (přehled)

1. Onboarding s výběrem oblíbených témat
2. Feed reelů: vertikální swipe mezi reely, horizontální swipe/ťuknutí mezi kartami
3. Interaktivní karty (kvíz, pravda/lež, odhalení odpovědi)
4. Režimy feedu: Pro tebe, Konkrétní téma, Opakování, Objevuj
5. Reakce na reel (znal jsem / nové / wow / nezajímá mě) a uložení do sbírky
6. Adaptivní váhy témat podle chování uživatele
7. Opakování v intervalech (Leitner)
8. Série s progresem
9. Profil: správa témat, sbírka, statistiky, tmavý režim

### 2.3 Uživatelé

| Role | Popis |
|---|---|
| **Uživatel** | Kdokoli, kdo se chce něco naučit. Má účet, vybraná témata a vlastní historii. |
| **Vývojář / admin** | V MVP spravuje obsah přes seed soubory. Admin UI v MVP není. |

### 2.4 Omezení

- Mobilní appka: **Expo (nejnovější stabilní SDK), React Native, TypeScript**
- Backend: **Node.js 20+, Hono, Drizzle ORM, better-sqlite3, Zod**
- Monorepo: **pnpm workspaces**
- Obsah MVP je **jen v češtině**
- Aplikace musí fungovat na telefonech s šířkou displeje od 360 dp

### 2.5 Předpoklady a závislosti

- Vývoj probíhá v Expo Go / development buildu, na fyzickém zařízení nebo emulátoru.
- Backend běží lokálně. Mobilní appka se k němu připojuje přes IP adresu v lokální síti, nastavitelnou přes `.env` (`EXPO_PUBLIC_API_URL`).

---

## 3. Funkční požadavky

### 3.1 Účet a autentizace

| ID | Požadavek | Priorita |
|---|---|---|
| FR-01 | Uživatel se může registrovat e-mailem a heslem (min. 8 znaků). | M |
| FR-02 | Uživatel se může přihlásit a odhlásit. | M |
| FR-03 | Hesla se ukládají hashovaná (PBKDF2-SHA512 nebo scrypt, s náhodným saltem). | M |
| FR-04 | Po přihlášení dostane klient **bearer token**. Mobilní appka ho uloží do `expo-secure-store` a posílá v hlavičce `Authorization`. | M |
| FR-05 | Přihlášení přetrvá restart aplikace, dokud se uživatel neodhlásí. | M |
| FR-06 | Režim hosta: aplikaci jde vyzkoušet bez účtu a data se později převedou do účtu. | C |
| FR-07 | Přihlášení přes Google/Apple. | W |

### 3.2 Onboarding a výběr témat

| ID | Požadavek | Priorita |
|---|---|---|
| FR-10 | Po první registraci se zobrazí obrazovka výběru témat. Témata jsou seskupená podle kategorií a zobrazená jako chipy (ikona + název). | M |
| FR-11 | Uživatel musí vybrat **alespoň 3 témata**, jinak nemůže pokračovat. | M |
| FR-12 | Vybraná témata dostanou výchozí váhu **0,7**. Nevybraná témata se do `user_topics` nezapisují. | M |
| FR-13 | Výběr témat jde kdykoli změnit v Profilu. Odebrání tématu smaže jeho váhu, znovupřidání ji nastaví na 0,7. | M |
| FR-14 | Krátké intro (2–3 obrazovky), které vysvětlí ovládání: swipe nahoru = další reel, doprava/ťuknutí = další karta. | S |

### 3.3 Feed a přehrávání reelů

| ID | Požadavek | Priorita |
|---|---|---|
| FR-20 | Feed je **vertikální stránkovaný seznam** a každý reel zabírá celou obrazovku. Swipe nahoru = další reel, dolů = předchozí. | M |
| FR-21 | Uvnitř reelu se mezi kartami přechází **ťuknutím na pravou/levou polovinu** obrazovky nebo **horizontálním swipem**. | M |
| FR-22 | Nahoře je **indikátor průběhu** (segmentovaný pruh jako u Instagram Stories) s počtem karet a aktuální pozicí. | M |
| FR-23 | Každý reel ukazuje kategorii (ikona + barva), téma a na poslední kartě odkaz na zdroj (`sourceUrl`), pokud existuje. | M |
| FR-24 | Interaktivní karta (kvíz, pravda/lež, odhalení) **blokuje přechod dál**, dokud uživatel neodpoví nebo neodhalí odpověď. Vertikální swipe na další reel zůstává povolený. | M |
| FR-25 | Feed se načítá po stránkách (kurzorová paginace, 10 reelů na stránku) a další stránka se předběžně načte, když zbývají 3 reely. | M |
| FR-26 | Už viděné reely se v režimu Pro tebe znovu nezobrazují (kromě režimu Opakování). | M |
| FR-27 | Když dojdou nové reely, zobrazí se karta „Všechno jsi viděl 🎉“ s nabídkou: přidat témata / přejít do Objevuj / Opakování. | M |
| FR-28 | Animovaný vstup textu karty (fade/slide, případně postupné „psaní“). Respektuje systémové nastavení **Omezit pohyb**. | S |
| FR-29 | Haptická odezva při odpovědi na kvíz (správně/špatně). | S |
| FR-30 | Předčítání karet hlasem (TTS, `expo-speech`). | C |

### 3.4 Typy karet

Podrobné schéma je v [kap. 5](#5-typy-karet-a-schéma-obsahu).

| ID | Požadavek | Priorita |
|---|---|---|
| FR-40 | Podporované typy v MVP: `hook`, `fact`, `quiz`, `trueFalse`, `reveal`, `comparison`, `myth`, `punchline`. | M |
| FR-41 | Typ `timeline` (časová osa s 3–5 událostmi). | S |
| FR-42 | U kvízu a pravdy/lži se po odpovědi zobrazí, co bylo správně, a krátké vysvětlení. | M |
| FR-43 | Každý typ karty má vlastní komponentu, kterou vybírá centrální `CardRenderer` podle `type` (diskriminovaná unie). | M |
| FR-44 | Když server pošle neznámý typ karty, klient ho **přeskočí**, zaloguje varování a nespadne. | M |

### 3.5 Reakce, sbírka a signály

| ID | Požadavek | Priorita |
|---|---|---|
| FR-50 | Na poslední kartě reelu (a v akčním panelu po straně) může uživatel zvolit reakci: **🧠 Znal jsem**, **💡 Nové**, **🤯 Wow**. | M |
| FR-51 | Akce **„Nezajímá mě“** (v menu ⋯) sníží váhu tématu a reel skryje. | M |
| FR-52 | Uživatel může reel **uložit do sbírky** (záložka) a zase ho odebrat. | M |
| FR-53 | Klient zaznamenává **události zhlédnutí**: `started`, `completed` (dosažena poslední karta), `skipped` (odchod z reelu do 2 s bez posunu na další kartu), odpověď na kvíz (správně/špatně). | M |
| FR-54 | Události se posílají dávkově (max. co 10 s nebo při odchodu z appky do pozadí). Při výpadku sítě se uloží do fronty a odešlou později. | S |
| FR-55 | Tlačítko **„Chci víc 🐇“**: otevře režim Konkrétní téma pro téma daného reelu, nebo pokračuje v jeho sérii. | S |
| FR-56 | Sdílení reelu (systémový share sheet s textem hooku a deep linkem). | C |

### 3.6 Režimy feedu

| ID | Požadavek | Priorita |
|---|---|---|
| FR-60 | Nahoře na obrazovce feedu jsou záložky: **✨ Pro tebe**, **🔁 Opakování**, **🎲 Objevuj**. | M |
| FR-61 | **Pro tebe**: vážený mix podle algoritmu v [kap. 6](#6-doporučovací-algoritmus). | M |
| FR-62 | **Konkrétní téma**: otevře se z profilu, z chipu tématu na reelu nebo přes „Chci víc“. Obsahuje jen reely daného tématu. | M |
| FR-63 | **Opakování**: reely, jejichž `nextReviewAt <= now`, zobrazené jako kvízová verze (viz FR-80). Počet čekajících se ukazuje jako odznak na záložce. | M |
| FR-64 | **Objevuj**: jen reely z témat, která uživatel **nemá** vybraná, náhodně řazené. | S |

### 3.7 Série

| ID | Požadavek | Priorita |
|---|---|---|
| FR-70 | Reel může patřit do série (`seriesId`, `seriesOrder`). | M (datový model) |
| FR-71 | V režimu Pro tebe se z nerozkoukané série nabízí vždy **jen další díl v pořadí**. | S |
| FR-72 | Reel v sérii ukazuje štítek „Díl 3/10“. Na profilu je přehled rozpracovaných sérií s progresem. | S |

### 3.8 Opakování (spaced repetition)

| ID | Požadavek | Priorita |
|---|---|---|
| FR-80 | Každý reel, který uživatel dokončil (`completed`) a který obsahuje aspoň jednu kartu `quiz`/`trueFalse`/`reveal`, se zařadí do opakování. | M |
| FR-81 | Plánování podle **Leitnerových přihrádek** s intervaly **1, 3, 7, 16, 35 dní** (přihrádky 1–5). | M |
| FR-82 | Správná odpověď v opakování posune reel o přihrádku výš, špatná ho vrátí do přihrádky 1. Po úspěchu v přihrádce 5 je reel „naučený“ a z opakování zmizí. | M |
| FR-83 | Opakování zobrazí jen interaktivní karty reelu (ne celý příběh), s možností „Ukázat celý reel“. | M |
| FR-84 | Reakce „Znal jsem“ zařadí reel rovnou do přihrádky 3. | S |
| FR-85 | V režimu Pro tebe se čekající opakování občas vloží přímo do feedu (max. 1 na 8 reelů). | C |

### 3.9 Profil a nastavení

| ID | Požadavek | Priorita |
|---|---|---|
| FR-90 | Profil zobrazuje: vybraná témata (editovatelná), sbírku uložených reelů, statistiky (počet dokončených reelů, úspěšnost kvízů, naučené reely, denní série). | M |
| FR-91 | Tmavý / světlý / systémový režim, volba se pamatuje. | M |
| FR-92 | Denní série (streak): den se počítá, když uživatel dokončí aspoň 3 reely. Bez notifikací a bez penalizace, jen informativně. | S |
| FR-93 | Nastavení velikosti písma karet (malé / střední / velké), navíc k systémovému škálování. | S |
| FR-94 | Připomínka opakování jako push notifikace. | C |

---

## 4. Datový model

Drizzle schéma pro SQLite. Časy se ukládají jako ISO string nebo unix timestamp (vyber jedno a drž se ho). ID jsou textová (`nanoid` / slug u obsahu).

```ts
// ---------- Obsah ----------
categories {
  id: text PK            // slug, např. "science"
  name: text             // "Věda"
  icon: text             // emoji nebo název ikony
  color: text            // hex, základ gradientu karet
  order: integer
}

topics {
  id: text PK            // "astronomy"
  categoryId: text FK -> categories.id
  name: text             // "Astronomie"
  description: text
  icon: text
}

tags {
  id: text PK            // "planety"
  name: text
}

series {
  id: text PK
  topicId: text FK -> topics.id
  title: text
  description: text
}

reels {
  id: text PK
  topicId: text FK -> topics.id
  title: text            // interní/čitelný název
  seriesId: text FK -> series.id NULL
  seriesOrder: integer NULL
  sourceUrl: text NULL
  sourceTitle: text NULL
  status: text           // "draft" | "published"  (pro budoucí pipeline)
  origin: text           // "manual" | "ai"          (pro budoucí pipeline)
  createdAt
}

reel_tags { reelId FK, tagId FK, PK(reelId, tagId) }

cards {
  id: text PK
  reelId: text FK -> reels.id ON DELETE CASCADE
  order: integer
  type: text             // diskriminátor, viz kap. 5
  content: text (JSON)   // validováno Zod schématem podle `type`
}

// ---------- Uživatel ----------
users {
  id: text PK
  email: text UNIQUE
  passwordHash: text
  salt: text
  displayName: text NULL
  onboardedAt: NULL
  createdAt
}

sessions {
  token: text PK         // náhodných 32 bajtů, hex
  userId: text FK
  createdAt
  expiresAt
}

user_topics {
  userId FK, topicId FK, PK(userId, topicId)
  weight: real           // 0.05–1.0
  selected: integer      // 1 = vybral si ho, 0 = jen naučená váha (z Objevuj)
  updatedAt
}

user_reels {
  userId FK, reelId FK, PK(userId, reelId)
  firstSeenAt
  lastSeenAt
  completed: integer (bool)
  reaction: text NULL    // "knew" | "new" | "wow"
  hidden: integer (bool) // "nezajímá mě"
  saved: integer (bool)
  reviewBox: integer NULL        // 1–5, NULL = není v opakování
  nextReviewAt: NULL
  learnedAt: NULL
}

quiz_answers {
  id PK
  userId FK, cardId FK
  correct: integer (bool)
  context: text          // "feed" | "review"
  answeredAt
}
```

Indexy: `reels(topicId)`, `cards(reelId, order)`, `user_reels(userId, nextReviewAt)`, `user_topics(userId)`.

---

## 5. Typy karet a schéma obsahu

Definuje se v `packages/shared/src/cards.ts` jako **Zod diskriminovaná unie** podle `type`. Stejné schéma validuje seed data, odpovědi API i (v budoucnu) výstup AI.

| Typ | Účel | Obsah (`content`) |
|---|---|---|
| `hook` | Úvodní háček, vždy první karta | `{ text: string (≤140), emoji?: string }` |
| `fact` | Vysvětlení / fakt | `{ text: string (≤220), highlight?: string }` (část textu, která se zvýrazní) |
| `quiz` | Otázka s výběrem | `{ question: string, options: string[2..4], correctIndex: number, explanation: string }` |
| `trueFalse` | Pravda, nebo lež? | `{ statement: string, isTrue: boolean, explanation: string }` |
| `reveal` | Tipni si, pak ťukni | `{ prompt: string, answer: string, detail?: string }` |
| `comparison` | Srovnání dvou věcí čísly | `{ title: string, left: { label, value: number, unit }, right: { label, value: number, unit }, note?: string }` (vizualizace jako dva sloupce) |
| `myth` | Mýtus vs. realita | `{ myth: string, reality: string }` |
| `timeline` | Časová osa (S) | `{ title: string, events: { year: string, text: string }[3..5] }` |
| `punchline` | Závěrečná pointa, vždy poslední karta | `{ text: string (≤160), emoji?: string }` |

**Pravidla skladby reelu** (validovat v Zod `refine` na úrovni reelu):
- 3–7 karet,
- první karta je `hook`, poslední je `punchline`,
- nejvýš 2 interaktivní karty (`quiz`, `trueFalse`, `reveal`) na reel,
- aspoň 1 interaktivní karta (kvůli opakování). U seed dat je to **doporučení**, validátor jen varuje.

**Vizuální pravidla:**
- Pozadí karty je gradient z barvy kategorie. Každý typ karty má jemně odlišný layout (např. `myth` rozdělí obrazovku na dvě poloviny, `comparison` ukazuje sloupce).
- Hlavní text má min. 22 pt (ve střední velikosti), max. ~3 řádky na obrazovku u `hook`/`punchline`.
- Kontrast textu vůči pozadí musí být aspoň **4,5 : 1** (WCAG AA).

### 5.1 Ukázkový reel (seed JSON)

```json
{
  "id": "venus-hottest-planet",
  "topicId": "astronomy",
  "title": "Proč je Venuše nejteplejší planeta",
  "tags": ["planety", "skleníkový-efekt"],
  "sourceUrl": "https://cs.wikipedia.org/wiki/Venuše",
  "sourceTitle": "Wikipedie: Venuše",
  "cards": [
    { "type": "hook", "content": { "text": "Merkur je nejblíž Slunci. Nejteplejší planeta ale není.", "emoji": "🔥" } },
    { "type": "quiz", "content": {
        "question": "Která planeta je nejteplejší?",
        "options": ["Merkur", "Venuše", "Mars", "Jupiter"],
        "correctIndex": 1,
        "explanation": "Venuše má na povrchu kolem 465 °C, ve dne i v noci."
    } },
    { "type": "fact", "content": {
        "text": "Venuši obaluje hustá atmosféra z CO₂, která zadržuje teplo jako peřina. Skleníkový efekt se vymkl kontrole.",
        "highlight": "skleníkový efekt"
    } },
    { "type": "comparison", "content": {
        "title": "Průměrná teplota povrchu",
        "left":  { "label": "Merkur", "value": 167, "unit": "°C" },
        "right": { "label": "Venuše", "value": 465, "unit": "°C" }
    } },
    { "type": "punchline", "content": { "text": "Na Venuši by se olovo roztavilo jako máslo na pánvi.", "emoji": "🤯" } }
  ]
}
```

---

## 6. Doporučovací algoritmus

Implementuje se na serveru jako **čistá funkce** (`buildFeed(userState, candidates, rng)`), aby šla testovat bez databáze. `rng` se předává jako parametr kvůli deterministickým testům.

### 6.1 Režim „Pro tebe“

1. **Kandidáti:** publikované reely, které uživatel ještě neviděl a nemá skryté. U sérií jen další díl v pořadí (FR-71).
2. **Skladba stránky (10 reelů):**
   - **80 %** z vybraných témat (`selected = 1`), vážený náhodný výběr podle `weight`,
   - **15 %** z příbuzných témat: nevybraná témata, jejichž reely sdílejí aspoň 1 štítek s reely, které uživatel dokončil nebo ocenil,
   - **5 %** wildcard: náhodné nevybrané téma.
   - Když v některém koši nejsou kandidáti, jeho místo se doplní z koše 80 %.
3. **Diverzita:** nikdy ne víc než **2 reely ze stejného tématu za sebou**.
4. **Kurzor:** stránkování přes neprůhledný kurzor. Server si nemusí držet stav, stačí vracet už viděné/servírované ID nebo seed + offset.

### 6.2 Aktualizace váhy tématu

Po každé události se upraví `user_topics.weight` tématu reelu. Hodnota se omezí na **[0,05; 1,0]**:

| Signál | Změna váhy |
|---|---|
| `completed` | +0,03 |
| reakce `wow` | +0,08 |
| reakce `new` | +0,04 |
| reakce `knew` | +0,00 |
| `saved` | +0,05 |
| `skipped` | −0,04 |
| „Nezajímá mě“ | −0,20 |

Když uživatel dostane pozitivní signál u reelu z **nevybraného** tématu (z koše 15 % / 5 % / Objevuj), vytvoří se záznam `user_topics` se `selected = 0` a počáteční váhou 0,3. Takové téma se pak započítává do koše „příbuzná“ s touto váhou.

Konstanty (poměry košů, změny vah, intervaly Leitneru) patří do `packages/shared/src/constants.ts`.

---

## 7. Rozhraní API

REST přes Hono, typovaný klient přes **Hono RPC** (`hc<AppType>`). Všechny vstupy se validují Zod schématy ze `shared`. Chyby mají jednotný formát `{ error: { code: string, message: string } }`.

| Metoda | Cesta | Auth | Popis |
|---|---|---|---|
| POST | `/auth/register` | ✗ | `{ email, password }` → `{ token, user }` |
| POST | `/auth/login` | ✗ | `{ email, password }` → `{ token, user }` |
| POST | `/auth/logout` | ✓ | zneplatní token |
| GET | `/me` | ✓ | profil + statistiky |
| GET | `/catalog` | ✗ | kategorie + témata (pro onboarding a profil) |
| GET | `/me/topics` | ✓ | vybraná témata s váhami |
| PUT | `/me/topics` | ✓ | `{ topicIds: string[] }` (min. 3), nastaví výběr |
| GET | `/feed?mode=forYou\|topic\|discover&topicId=&cursor=` | ✓ | `{ reels: Reel[], nextCursor: string \| null }` |
| GET | `/review?cursor=` | ✓ | čekající opakování (reely jen s interaktivními kartami) |
| GET | `/reels/:id` | ✓ | detail reelu (pro deep link, sbírku) |
| POST | `/events` | ✓ | dávka událostí `{ events: Event[] }` (FR-53) |
| POST | `/reels/:id/reaction` | ✓ | `{ reaction: "knew" \| "new" \| "wow" }` |
| POST | `/reels/:id/hide` | ✓ | „Nezajímá mě“ |
| PUT/DELETE | `/reels/:id/save` | ✓ | uložit / odebrat ze sbírky |
| GET | `/me/saved?cursor=` | ✓ | sbírka |
| GET | `/me/series` | ✓ | rozpracované série s progresem (S) |

`Event` = `{ type: "started" | "completed" | "skipped" | "answer", reelId, cardId?, correct?, context: "feed" | "review", at: ISO string }`. Endpoint `/events` musí být **idempotentní** vůči opakovanému odeslání stejné dávky (klient generuje `eventId`).

---

## 8. Nefunkční požadavky

| ID | Požadavek | Priorita |
|---|---|---|
| NFR-01 | **Plynulost:** swipe mezi reely i kartami běží v 60 fps na středně výkonném Android zařízení. Animace přes Reanimated na UI vlákně. | M |
| NFR-02 | **Rychlost:** první reel se zobrazí do 1,5 s od otevření appky (při dostupném serveru v LAN). Přechod na další reel je okamžitý (reel je předem načtený). | M |
| NFR-03 | **Offline:** posledních ≥ 20 načtených reelů je v cache (TanStack Query persist + AsyncStorage/MMKV) a dají se procházet offline. Události se odešlou po obnovení připojení. | S |
| NFR-04 | **Přístupnost:** podpora čtečky obrazovky (VoiceOver/TalkBack) s popisky všech ovládacích prvků, alternativní tlačítka „Další karta“ / „Další reel“ pro čtečky, respektování dynamické velikosti písma a nastavení Omezit pohyb, kontrast WCAG AA. | M |
| NFR-05 | **Bezpečnost:** hashovaná hesla, token v SecureStore, rate limiting na `/auth/*` (např. 10 požadavků/min/IP), validace všech vstupů, žádné citlivé údaje v logu. | M |
| NFR-06 | **Robustnost:** neplatná data karty od serveru nesmí shodit aplikaci (FR-44). Globální error boundary s obrazovkou „Něco se pokazilo, zkusit znovu“. | M |
| NFR-07 | **Testovatelnost:** doménová logika (feed algoritmus, Leitner, aktualizace vah, validace reelu) je v čistých funkcích a má jednotkové testy. | M |
| NFR-08 | **Kvalita kódu:** ESLint + Prettier, TypeScript strict, žádné `any` bez komentáře, CI skript `pnpm check` (lint + typecheck + testy). | M |
| NFR-09 | **Lokalizace:** texty UI v jednom modulu, připravené na i18n. | S |
| NFR-10 | **Témata vzhledu:** světlý i tmavý režim, barvy přes design tokeny. | M |

---

## 9. Architektura a technologie

### 9.1 Struktura repozitáře

```
curio/
├── apps/
│   ├── mobile/                 # Expo app
│   │   ├── app/                # expo-router (souborové routování)
│   │   │   ├── (auth)/         # login, register
│   │   │   ├── onboarding/     # výběr témat, intro
│   │   │   ├── (tabs)/         # feed, profil
│   │   │   └── topic/[id].tsx  # režim Konkrétní téma
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── feed/       # FeedPager, ReelView, ProgressBar
│   │   │   │   ├── cards/      # CardRenderer + komponenta pro každý typ
│   │   │   │   ├── review/
│   │   │   │   ├── profile/
│   │   │   │   └── onboarding/
│   │   │   ├── lib/            # api klient, auth storage, event queue
│   │   │   ├── theme/          # tokeny, barvy kategorií, typografie
│   │   │   └── i18n/           # texty UI
│   │   └── app.config.ts
│   └── server/
│       ├── src/
│       │   ├── db/             # drizzle schema, migrace, seed loader
│       │   ├── routes/         # auth, catalog, feed, review, reels, events, me
│       │   ├── domain/         # buildFeed, leitner, weights (čisté funkce)
│       │   ├── middleware/     # auth, rate limit, error handler
│       │   └── index.ts        # export type AppType
│       └── drizzle.config.ts
├── packages/
│   ├── shared/                 # Zod schémata (cards, reel, api, events), konstanty, typy
│   └── content/                # seed JSON: categories, topics, reels/*.json
├── pnpm-workspace.yaml
└── package.json                # skripty: dev, check, test, db:push, db:seed
```

### 9.2 Technologie

| Oblast | Volba |
|---|---|
| Mobil | Expo (nejnovější stabilní SDK), expo-router, TypeScript |
| Gesta a animace | react-native-gesture-handler, react-native-reanimated |
| Vertikální feed | `FlatList`/`FlashList` s `pagingEnabled` + `snapToInterval`, nebo `react-native-pager-view` (vertikální). Zvolit podle plynulosti na Androidu. |
| Server state | TanStack Query (+ persist pro offline) |
| Lokální stav | React Context / Zustand (jen pro UI stav, např. aktuální karta) |
| Úložiště | expo-secure-store (token), AsyncStorage nebo MMKV (cache, fronta událostí, nastavení) |
| Styly | StyleSheet + design tokeny (případně NativeWind, pokud to autor preferuje) |
| Backend | Hono + @hono/node-server, Drizzle ORM, better-sqlite3, Zod, @hono/zod-validator |
| Testy | Vitest (shared, server), jest-expo + @testing-library/react-native (mobile) |

### 9.3 Klíčové principy

- **Jeden zdroj typů:** `packages/shared` exportuje Zod schémata i odvozené typy (`z.infer`). Server i mobil je importují.
- **Doménová logika mimo routy:** routy jen validují vstup, zavolají doménovou funkci a vrátí výsledek.
- **CardRenderer:** mapa `type → komponenta`. Přidat nový typ karty znamená přidat Zod schéma + komponentu, nic dalšího.

---

## 10. Budoucí rozšíření: obsahová pipeline

> **Mimo rozsah MVP.** Tady je jen popsané, s čím má datový model počítat.

Hybridní tvorba obsahu:
1. **Zdroj:** článek (např. Wikipedie) nebo jiný ověřitelný text + URL.
2. **Generování:** LLM (Claude API) dostane zdrojový text a instrukce ke skladbě reelu a vrátí JSON podle schématu z `packages/shared`.
3. **Validace:** Zod schéma + pravidla skladby (kap. 5). Nevalidní výstup se zahodí nebo pošle k opravě.
4. **Kontrola faktů:** druhý průchod ověří, že každé tvrzení v kartách je podložené zdrojovým textem.
5. **Uložení** se `status = "draft"`, `origin = "ai"`, `sourceUrl`. Po schválení se přepne na `"published"`.
6. Později: uživatel si zadá **vlastní téma** („chci se učit o sopkách“) a pipeline mu vygeneruje sérii.

Proto už MVP obsahuje pole `status`, `origin`, `sourceUrl`, `sourceTitle` a validaci reelu jako samostatnou funkci.

---

## 11. Plán implementace

| Fáze | Obsah | Hotovo, když |
|---|---|---|
| **1. Základ** | Monorepo (pnpm), `shared` se Zod schématy karet/reelu + testy validace, server s Drizzle schématem a seed loaderem z `packages/content` | `pnpm db:seed` naplní DB, seed data projdou validací, `pnpm check` je zelené |
| **2. API** | Auth, catalog, feed (nejdřív jednoduché: náhodně z vybraných témat), reels, events | Integrační testy endpointů procházejí |
| **3. Mobil: kostra** | Expo + router, auth obrazovky, onboarding s výběrem témat, API klient | Jde se registrovat, vybrat témata a dostat se na prázdný feed |
| **4. Feed a karty** | FeedPager, ReelView, ProgressBar, CardRenderer + všechny M typy karet, reakce, uložení | Seed reely jdou plynule procházet, kvízy fungují |
| **5. Personalizace** | `buildFeed` podle kap. 6, aktualizace vah, fronta událostí | Jednotkové testy algoritmu, feed reaguje na reakce |
| **6. Opakování** | Leitner, `/review`, záložka Opakování s odznakem | Dokončený reel se po intervalu objeví v Opakování |
| **7. Profil a dokončení** | Profil, statistiky, sbírka, tmavý režim, přístupnost, error boundary | Splněna akceptační kritéria (kap. 13) |
| **8. Should** | Série, Objevuj, offline cache, animace textu, streak, haptika | dle priorit |

---

## 12. Vývojová seed data

Umístění: `packages/content/`. Soubory `categories.json`, `topics.json`, `tags.json` a `reels/<topicId>/<reelId>.json`.

**Minimální rozsah pro vývoj:**

| Kategorie | Témata | Reelů na téma |
|---|---|---|
| 🔬 Věda (`science`) | Astronomie, Lidské tělo | 4 |
| 🏛️ Historie (`history`) | Starověk, 20. století | 4 |
| 🧠 Psychologie (`psychology`) | Kognitivní zkreslení, Spánek a paměť | 4 |
| 💡 Technologie (`tech`) | Jak funguje internet | 4 |

Celkem **7 témat × 4 reely = 28 reelů**, z toho:
- aspoň 1 série (např. 4 díly „Sluneční soustava“ v Astronomii),
- každý typ karty (M) se vyskytuje aspoň 3×,
- aspoň 3 reely sdílejí štítky napříč kategoriemi (kvůli testování koše „příbuzná“),
- fakta musí být pravdivá a mít `sourceUrl`.

Seed loader musí být **idempotentní** (upsert podle ID) a před vložením validovat každý reel. Nevalidní reel zastaví seed s čitelnou chybou (soubor + cesta k chybnému poli).

---

## 13. Akceptační kritéria MVP

1. Nový uživatel se zaregistruje, vybere 3+ témata a do 3 obrazovek vidí první reel.
2. Swipe nahoru přejde na další reel, ťuknutí vpravo/vlevo na další/předchozí kartu, indikátor průběhu odpovídá.
3. Kvízovou kartu nejde přeskočit ťuknutím. Po odpovědi se ukáže správné řešení a vysvětlení.
4. Po reakci „Wow“ na 3 reely z tématu A se v dalších stránkách feedu objevuje téma A častěji než před tím (ověřeno jednotkovým testem `buildFeed` s pevným seedem RNG).
5. „Nezajímá mě“ reel skryje a sníží váhu tématu.
6. Dokončený reel s kvízem se objeví v záložce Opakování po 1 dni (v testech přes posun času). Správná odpověď ho posune do přihrádky 2 (interval 3 dny).
7. Uložený reel je v sbírce v Profilu a dá se odebrat.
8. Změna témat v Profilu se hned projeví ve feedu.
9. Aplikace nespadne při neznámém typu karty ani při výpadku serveru (zobrazí chybový stav s možností opakovat).
10. `pnpm check` (lint, typecheck, testy všech balíčků) projde bez chyb.

---

## 14. Mimo rozsah MVP (Won't)

- Automatická tvorba obsahu (pipeline z kap. 10)
- Admin rozhraní pro správu obsahu
- Sociální funkce (sledování lidí, komentáře, žebříčky)
- Přihlášení přes Google/Apple
- Push notifikace
- Videa, audio (kromě volitelného TTS)
- Monetizace
- Vícejazyčný obsah
- Nasazení do produkce / App Store / Google Play
