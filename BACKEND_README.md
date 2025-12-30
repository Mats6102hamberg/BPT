# 🚀 Backend Architecture - Vercel Postgres + Next.js API Routes

## Overview

Systemet använder nu en fullständig backend med Vercel Postgres för att möjliggöra delad data mellan alla användare.

## Arkitektur

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Zustand Store  │  ← State Management
│  (API version)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Next.js API    │  ← API Routes (/api/*)
│    Routes       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Vercel Postgres │  ← Database (Neon Serverless)
│   Database      │
└─────────────────┘
```

## API Endpoints

### Tournaments

**GET** `/api/tournaments`
- Hämta alla tävlingar med lag och matcher

**POST** `/api/tournaments`
- Skapa ny tävling
- Body: `{ name, date, settings, currentPhase, currentRound }`

**GET** `/api/tournaments/[id]`
- Hämta specifik tävling med alla detaljer

**PATCH** `/api/tournaments/[id]`
- Uppdatera tävling (fas, rond)
- Body: `{ currentPhase, currentRound }`

**DELETE** `/api/tournaments/[id]`
- Radera tävling (CASCADE raderar också lag och matcher)

### Teams

**POST** `/api/teams`
- Lägg till lag i tävling
- Body: `{ tournamentId, name, players, contactInfo }`

**PATCH** `/api/teams`
- Uppdatera lag-statistik (poäng, vinster, etc)
- Body: `{ id, wins, losses, points, buchholz, opponents }`

**DELETE** `/api/teams?id=xxx`
- Radera lag

### Matches

**POST** `/api/matches`
- Skapa ny match
- Body: `{ tournamentId, round, team1Id, team2Id }`

**PATCH** `/api/matches`
- Registrera matchresultat
- Body: `{ id, team1Score, team2Score, winnerId, isCompleted }`

**DELETE** `/api/matches?id=xxx`
- Radera match

### Announcements

**GET** `/api/announcements`
- Hämta alla meddelanden

**POST** `/api/announcements`
- Skapa nytt meddelande
- Body: `{ title, message, tournamentId, tournamentName, priority }`

**PATCH** `/api/announcements`
- Markera som läst
- Body: `{ id, userId }`

**DELETE** `/api/announcements?id=xxx`
- Radera meddelande

## Database Schema

### tournaments
```sql
id                TEXT PRIMARY KEY
name              TEXT NOT NULL
date              TEXT NOT NULL
settings          JSONB NOT NULL
current_phase     TEXT NOT NULL
current_round     INTEGER DEFAULT 0
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### teams
```sql
id                TEXT PRIMARY KEY
tournament_id     TEXT (FK → tournaments)
name              TEXT NOT NULL
players           JSONB NOT NULL
contact_info      TEXT
wins              INTEGER DEFAULT 0
losses            INTEGER DEFAULT 0
points            INTEGER DEFAULT 0
buchholz          INTEGER DEFAULT 0
opponents         JSONB DEFAULT []
created_at        TIMESTAMP
```

### matches
```sql
id                TEXT PRIMARY KEY
tournament_id     TEXT (FK → tournaments)
round             INTEGER NOT NULL
team1_id          TEXT (FK → teams)
team2_id          TEXT (FK → teams)
team1_score       INTEGER
team2_score       INTEGER
is_completed      BOOLEAN DEFAULT FALSE
winner_id         TEXT
created_at        TIMESTAMP
```

### announcements
```sql
id                TEXT PRIMARY KEY
title             TEXT NOT NULL
message           TEXT NOT NULL
tournament_id     TEXT (FK → tournaments)
tournament_name   TEXT
priority          TEXT CHECK (normal|important|urgent)
created_at        BIGINT NOT NULL
read_by           JSONB DEFAULT []
```

## Filer

### Backend
- `sql/schema.sql` - Databas-schema
- `src/lib/db-client.ts` - Postgres klient wrapper
- `src/app/api/tournaments/route.ts` - Tournament endpoints
- `src/app/api/tournaments/[id]/route.ts` - Specifik tournament
- `src/app/api/teams/route.ts` - Team endpoints
- `src/app/api/matches/route.ts` - Match endpoints
- `src/app/api/announcements/route.ts` - Announcement endpoints

### Frontend (API version)
- `src/stores/tournament-store-api.ts` - Ny store med API-anrop
- `src/lib/announcement-api.ts` - Announcement API wrapper

### Legacy (Backup)
- `src/stores/tournament-store.ts` - Gamla IndexedDB-versionen
- `src/lib/db.ts` - IndexedDB implementation
- `src/lib/announcement-db.ts` - IndexedDB announcements

## Så här fungerar det

### 1. Användare skapar tävling:
```
Frontend → Zustand Store → POST /api/tournaments → Postgres
                           ← Tournament object ←
```

### 2. Användare lägger till lag:
```
Frontend → Zustand Store → POST /api/teams → Postgres
                           ← Team object ←
```

### 3. Starta Swiss-rond:
```
Frontend → Zustand Store
             ↓ GET tournament data
             ↓ Generate pairings (lokalt)
             ↓ POST /api/matches (för varje match)
             ↓ PATCH /api/tournaments (uppdatera rond)
             → Postgres
```

### 4. Registrera resultat:
```
Frontend → Zustand Store
             ↓ GET tournament data
             ↓ Calculate team stats (lokalt)
             ↓ PATCH /api/matches (matchen)
             ↓ PATCH /api/teams (alla lag)
             → Postgres
```

### 5. Meddelanden:
```
Tävlingsledning → POST /api/announcements → Postgres
                                            ↓
Deltagare → GET /api/announcements ← Ser meddelande!
```

## Fördelar med backend

✅ **Delad data** - Alla ser samma information
✅ **Samtidiga användare** - Obegränsat antal
✅ **Persistent** - Data försvinner inte
✅ **Synkroniserad** - Uppdateringar når alla
✅ **Säker** - Serversidan kontrollerar data
✅ **Skalbar** - Kan hantera stora tävlingar

## Miljövariabler (Automatiska från Vercel)

```
POSTGRES_URL               - Full connection string
POSTGRES_PRISMA_URL        - För Prisma (om du vill)
POSTGRES_URL_NON_POOLING   - Direkt anslutning
POSTGRES_USER              - Databasanvändare
POSTGRES_HOST              - Databasserver
POSTGRES_PASSWORD          - Lösenord
POSTGRES_DATABASE          - Databasnamn
```

## Prestandaoptimering

- **Connection pooling** - Vercel Postgres hanterar automatiskt
- **Edge runtime** - Snabba API-anrop från närmaste server
- **Caching** - Frontend cachar data i Zustand store
- **Indexes** - Databas-index på tournament_id, round, etc.

## Framtida förbättringar

- [ ] WebSocket för realtidsuppdateringar
- [ ] Optimistic UI updates
- [ ] Batch operations
- [ ] Background sync
- [ ] Service worker för offline-stöd
- [ ] Redis cache för snabbare läsningar
