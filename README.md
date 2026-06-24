<div align="center">

<img src="https://github.com/user-attachments/assets/0484a7c3-91bc-4e5f-99dd-6725c7ef3b07" alt="SmartFare Banner" width="100%"/>

<br/>

<img src="https://res.cloudinary.com/dxudggkln/image/upload/v1780140804/favicon_qt7k3d.png" alt="SmartFare Logo" width="80"/>

<h1>SmartFare</h1>

<h3>Piattaforma di pianificazione viaggi per l'Italia con AI, mappa interattiva e itinerari</h3>

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-smartfare.nicolas--dominici.it-4ade80?style=for-the-badge)](https://smartfare.nicolas-dominici.it)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Na1ky/SmartFare)

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white)

</div>

---

## 📖 Overview

SmartFare è una **piattaforma fullstack di travel planning** per l'Italia che combina scoperta pubblica, mappa interattiva, builder manuale di itinerari e due flussi di pianificazione assistiti da IA.

Il repository è organizzato come **monorepo** con due applicazioni runtime indipendenti:

- **[`Smartfare-Backend`](Smartfare-Backend/)** — API REST + streaming SSE con Express, Prisma, PostgreSQL, autenticazione JWT, upload Cloudinary e AI Gemini
- **[`Smartfare-Frontend`](Smartfare-Frontend/)** — SPA Angular 21 con routing lazy-loaded, SEO, i18n, rendering mappe Leaflet e chat AI in streaming

> Progetto realizzato da **DOMINICI Nicolas** · **PANSARDI Nicolò** · **TSATURYAN Igor**

---

## ✨ Funzionalità Principali

| | Feature | Descrizione |
|---|---|---|
| 🗺️ | **Mappa Interattiva** | Mappa Italia con Leaflet, clustering marker, caricamento bbox e ricerca geocoding |
| 🤖 | **Voyager AI** | Chat AI con streaming SSE, estrazione stato planner e generazione itinerari tramite Gemini |
| 📅 | **Planner Manuale** | Builder itinerario con gestione POI, preview, summary e mappa integrata |
| 🔍 | **Discover** | Ranking itinerari, top creator, viaggi vicini, ricerca tra viaggi/utenti/destinazioni |
| 🔐 | **Auth Completa** | Login/register locale, Google, GitHub; verifica email, reset password, sessioni JWT con revoca |
| 👤 | **Profilo Social** | Follower, itinerari salvati, preferiti, upload avatar/background, preferenze viaggio |
| 🌍 | **SEO + i18n** | Meta tag a livello di route, canonical URL, JSON-LD, sitemap e cambio lingua runtime |
| 🛡️ | **Sicurezza** | Helmet, rate limiting, allowlist CORS, moderazione contenuti client e server |

---

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────┐
│                 Smartfare-Frontend                   │
│  Angular 21 SPA · Leaflet Maps · AI Chat Streaming  │
│  SEO per-route · i18n · Standalone Components        │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / SSE
┌───────────────────────▼─────────────────────────────┐
│                 Smartfare-Backend                    │
│  Express 5 · TypeScript · JWT Auth · Rate Limiting  │
│  Zod Validation · Helmet · Cloudinary Upload         │
└───────────────────────┬─────────────────────────────┘
                        │ Prisma ORM
┌───────────────────────▼─────────────────────────────┐
│              PostgreSQL (via Prisma)                 │
│  Users · Itineraries · Chat · Locations · Social     │
└─────────────────────────────────────────────────────┘
                        +
              Gemini API · Cloudinary
              Nominatim · Unsplash · SendGrid
```

---

## 🧱 Stack Tecnologico

### Frontend

| Tecnologia | Versione | Utilizzo |
|---|---|---|
| Angular | 21.2.x | SPA, routing, DI, signals, build tooling |
| TypeScript | 5.9.x | Logica applicativa |
| RxJS | 7.8.x | Flussi HTTP e reattivi |
| Leaflet + markercluster | 1.9.x | Mappe interattive e clustering |
| Bootstrap | 5.3.x | Layout e primitive UI |
| AOS / typed.js | 2.3.x / 3.0.x | Animazioni ed effetti di typing |

### Backend

| Tecnologia | Versione | Utilizzo |
|---|---|---|
| Node.js + Express | 5.x | Server HTTP e API REST |
| TypeScript | 5.6.x | Logica server |
| Prisma Client | 7.7.x | ORM e accesso al database |
| PostgreSQL | — | Persistenza principale |
| Zod | 4.3.x | Validazione payload |
| Gemini API | — | Generazione AI |
| Cloudinary | — | Upload e storage media |
| Nodemailer / SendGrid | — | Invio email transazionali |
| JWT | 9.x | Token di sessione |

---

## 📁 Struttura del Progetto

```
SmartFare/
├── Smartfare-Backend/
│   ├── server.ts               # Entrypoint
│   ├── src/
│   │   ├── app.ts              # Config Express (cors, helmet, rate limit...)
│   │   ├── routes/             # auth, locations, itineraries, ai, chat, profile...
│   │   ├── services/           # auth, email, image, itinerary, ai, moderation
│   │   ├── middleware/         # JWT auth, content moderation, error handling
│   │   ├── schemas/            # Validazione Zod
│   │   └── models/             # Contratti TypeScript
│   └── prisma/
│       ├── schema.prisma       # Schema dati principale
│       └── migrations/         # SQL migration files
│
├── Smartfare-Frontend/
│   └── src/app/
│       ├── core/               # Auth, guards, interceptors, SEO, i18n, services
│       ├── features/           # home, discover, interactive-map, planner, auth, profile, voyager-ai
│       └── shared/             # Componenti condivisi (itinerary-card, ...)
│
└── utils/
    ├── docs/                   # Documentazione e generazione tesina
    ├── generate activities/    # Arricchimento dati POI
    └── generate qr/            # Generazione QR code
```

---

## 🚀 Installazione

### Prerequisiti

- Node.js 20+
- npm 11+
- Database PostgreSQL
- Account (opzionali): Gemini, Cloudinary, Google OAuth, GitHub OAuth, SendGrid/SMTP

### Setup

```bash
# 1. Clona il repository
git clone https://github.com/Na1ky/SmartFare.git
cd SmartFare

# 2. Installa le dipendenze
cd Smartfare-Backend && npm install
cd ../Smartfare-Frontend && npm install
```

### Configurazione Ambiente Backend

Crea `Smartfare-Backend/.env` con:

| Variabile | Descrizione |
|---|---|
| `PORT` | Porta HTTP (default: `3000`) |
| `JWT_SECRET` | Secret JWT — **obbligatoria** |
| `DIRECT_URL` | Connection string PostgreSQL (Prisma) |
| `FRONTEND_URL` | URL frontend per CORS e redirect OAuth |
| `GEMINI_API_KEY` | Gemini AI per Voyager e generazione itinerari |
| `ID_CLIENT` | Google OAuth client ID |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `CLOUDINARY_*` | Credenziali Cloudinary per upload media |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Config email transazionale |
| `SENDGRID_API_KEY` | Alternativa SMTP via SendGrid |

### Avvio in Development

```bash
# Backend (http://localhost:3000)
cd Smartfare-Backend
npm run dev

# Frontend (http://localhost:4200)
cd Smartfare-Frontend
npm start
```

### Build Production

```bash
# Backend
cd Smartfare-Backend
npm run build && npm start

# Frontend
cd Smartfare-Frontend
npm run build      # genera anche sitemap.xml prima del build
```

---

## 🔌 API Reference

<details>
<summary>🔐 Auth</summary>

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login email/password | No |
| POST | `/auth/register` | Registrazione | No |
| GET | `/auth/github` | OAuth GitHub | No |
| POST | `/auth/google` | Sign-in Google (ID token) | No |
| POST | `/auth/logout` | Revoca sessione | ✅ |
| POST | `/auth/forgot-password` | Email reset password | No |
| POST | `/auth/reset-password` | Reset con token | No |
| POST | `/auth/verify-email` | Verifica email account | No |

</details>

<details>
<summary>🗺️ Locations, Activities & Accommodation</summary>

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/locations` | Cerca per nome, provincia o CAP |
| GET | `/api/locations/carousel` | Destinazioni in evidenza |
| GET | `/api/activity/categories` | Categorie attività disponibili |
| GET | `/api/activity/area` | POI in una bounding box (mappa) |
| GET | `/api/accommodation` | Strutture per locationId |

</details>

<details>
<summary>📅 Itinerari</summary>

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/itineraries/public` | Lista itinerari pubblici | No |
| GET | `/api/itineraries/workspace` | Workspace aggregato per il builder | ✅ |
| POST | `/api/itineraries` | Crea/aggiorna bozza | ✅ |
| GET | `/api/itineraries/me` | Itinerari personali | ✅ |
| POST | `/api/itineraries/copy/:id` | Clona itinerario | ✅ |
| POST | `/api/itineraries/:id/favorite` | Aggiungi ai preferiti | ✅ |

</details>

<details>
<summary>🤖 AI & Chat Voyager</summary>

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| POST | `/api/ai/itinerary/generate` | Genera itinerario con Gemini | ✅ |
| POST | `/api/ai/itinerary/chat` | Modifica itinerario via AI | ✅ |
| POST | `/api/chat/sessions` | Crea sessione Voyager | ✅ |
| POST | `/api/chat/sessions/:id/stream` | Streaming SSE risposta AI | ✅ |
| POST | `/api/chat/sessions/:id/generate-itinerary` | Genera itinerario finale dalla chat | ✅ |

</details>

<details>
<summary>👤 Profilo & Social</summary>

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/profile/me` | Profilo + conteggi + preferenze | ✅ |
| PATCH | `/api/profile/me` | Aggiorna profilo | ✅ |
| POST | `/api/profile/upload/avatar` | Upload avatar Cloudinary | ✅ |
| POST | `/api/follow/:userId` | Segui un utente | ✅ |
| DELETE | `/api/follow/:userId` | Smetti di seguire | ✅ |
| DELETE | `/api/profile/account` | Elimina account e dati | ✅ |

</details>

---

## 🗄️ Database (Prisma Schema)

Modelli principali:

```
User ──────────── AuthSession (revoca JWT)
  │               ChatSession ─── ChatMessage
  ├── UserProfile
  ├── UserPreference ─── UserPreferenceInterest
  ├── Itinerary ─── ItineraryItem (activity | accommodation)
  │       └── ItineraryFavorite
  └── Follow (grafo sociale)

Location ─── Activity (POI)
         └── Accommodation
```

**Migrazioni disponibili:** chat sessions, auth sessions, immagini location.

---

## 👥 Team

| Nome | Ruolo |
|---|---|
| **Nicolas Dominici** | Fullstack — Backend, AI integration, deployment |
| **Nicolò Pansardi** | Frontend — Angular, UI/UX, docs |
| **Igor Tsaturyan** | Fullstack — Auth, database, mappe |
