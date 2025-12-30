# 🗄️ Database Setup - Vercel Postgres

## Steg 1: Skapa Postgres-databas på Vercel

1. Gå till ditt projekt på Vercel: https://vercel.com/dashboard
2. Välj projektet **BPT**
3. Gå till fliken **Storage**
4. Klicka på **Create Database**
5. Välj **Postgres** (Neon Serverless)
6. Välj region: **Europe (Frankfurt)** (närmast Sverige)
7. Klicka på **Create**

Vercel kommer automatiskt att:
- Skapa en Postgres-databas
- Generera anslutningsinformation
- Lägga till miljövariabler till ditt projekt

## Steg 2: Kör databas-schema

Efter att databasen är skapad:

1. Gå till **Storage** fliken i Vercel
2. Klicka på din nya Postgres-databas
3. Gå till fliken **Query**
4. Kopiera innehållet från `sql/schema.sql` filen
5. Klistra in i Query-editorn
6. Klicka på **Run Query**

Detta skapar alla nödvändiga tabeller:
- `tournaments` - Alla tävlingar
- `teams` - Lag för varje tävling
- `matches` - Matcher och resultat
- `announcements` - Meddelanden från tävlingsledningen

## Steg 3: Verifiera miljövariabler

Vercel lägger automatiskt till dessa miljövariabler:

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

Du behöver INTE lägga till dessa manuellt!

## Steg 4: Aktivera backend i koden

### Option A: Ersätt befintlig store (Rekommenderat)

Byt namn på filerna:

```bash
# Spara gamla versionen som backup
mv src/stores/tournament-store.ts src/stores/tournament-store-old.ts

# Aktivera nya API-versionen
mv src/stores/tournament-store-api.ts src/stores/tournament-store.ts
```

### Option B: Manuellt byta import

I alla filer som använder `useTournamentStore`, ändra importen från:

```typescript
import { useTournamentStore } from '@/stores/tournament-store';
```

Till:

```typescript
import { useTournamentStore } from '@/stores/tournament-store-api';
```

### Uppdatera announcement-funktioner

I `src/app/tavlingsledningen/page.tsx` och `src/app/page.tsx`, ändra från:

```typescript
import { announcementDB } from '@/lib/announcement-db';
```

Till:

```typescript
import { announcementAPI as announcementDB } from '@/lib/announcement-api';
```

## Steg 5: Deploy

```bash
git add .
git commit -m "Add database backend with Vercel Postgres"
git push
```

Vercel kommer automatiskt att:
1. Bygga om projektet
2. Ansluta till databasen
3. Deploya den nya versionen

## Verifiera att det fungerar

1. Öppna https://bpt-orpin.vercel.app
2. Skapa en ny tävling
3. Öppna appen på en annan enhet/webbläsare
4. Du ska se samma tävling på båda enheterna! ✅

## Skillnader från tidigare

### Före (IndexedDB):
- ❌ Data endast lokal per enhet
- ❌ Ingen synkronisering mellan användare
- ❌ Meddelanden syns inte på andra enheter

### Efter (Vercel Postgres):
- ✅ Delad data mellan ALLA användare
- ✅ Realtidsuppdateringar (vid siduppdatering)
- ✅ Tävlingsledningens meddelanden når alla
- ✅ Obegränsat antal samtidiga användare
- ✅ Ingen risк att förlora data

## Felsökning

### Problem: "Failed to load tournaments"

**Lösning:**
1. Kontrollera att databasen är skapad i Vercel
2. Verifiera att schema.sql har körts
3. Kolla att miljövariablerna finns i Vercel

### Problem: Tomma tabeller

**Lösning:**
- Gamla data från IndexedDB finns kvar lokalt
- Du kan exportera från gamla systemet och importera till nya
- Eller skapa nya tävlingar från början

### Kontrollera databas-innehåll

I Vercel:
1. Gå till **Storage** → Din Postgres-databas
2. Klicka på **Query**
3. Kör:

```sql
-- Se alla tävlingar
SELECT * FROM tournaments;

-- Se alla lag
SELECT * FROM teams;

-- Se alla meddelanden
SELECT * FROM announcements;

-- Räkna antal
SELECT
  (SELECT COUNT(*) FROM tournaments) as tournaments,
  (SELECT COUNT(*) FROM teams) as teams,
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM announcements) as announcements;
```

## Kostnad

**Vercel Postgres Free Tier:**
- ✅ 60 timmar compute per månad
- ✅ 256 MB data storage
- ✅ Perfekt för småskaliga tävlingar
- ✅ Kan uppgradera vid behov

För större tävlingar kan du uppgradera till Pro ($20/månad) för obegränsad användning.

## Support

Om något inte fungerar, kontakta mig eller kolla Vercel-loggar:
1. Gå till ditt projekt i Vercel
2. Klicka på **Logs**
3. Sök efter fel-meddelanden
# Database configured and ready!
