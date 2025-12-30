# 🏆 Cup System - TODO för nästa session

## ✅ Klart idag (2025-12-30):

### Backend Foundation:
- ✅ Cup bracket algoritmer i `src/lib/swiss-system.ts`:
  - `splitIntoABTournaments()` - Delar lag 50/50 i A och B
  - `generateCupMatches()` - Skapar matcher med BYE-hantering
  - `generateNextCupRound()` - Genererar nästa rond från vinnare
  - `isCupComplete()` - Kollar om turnering är klar
  - `getCupWinner()` - Hämtar vinnare

### Databas:
- ✅ `cupType` fält tillagt i Match type ('A' | 'B')
- ✅ SQL-migration klar: `sql/add_cup_type.sql`
- ✅ API routes uppdaterade för cupType

### Vad är pushat:
- ✅ Allt är committat och pushat till GitHub
- ✅ Vercel kommer auto-deploya

---

## 🚧 Återstår att göra (nästa session):

### 1. Kör SQL-migration i Neon:
```sql
-- Kör detta i Neon SQL Editor (Open in Neon från Vercel)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cup_type TEXT CHECK (cup_type IN ('A', 'B'));
CREATE INDEX IF NOT EXISTS idx_matches_cup_type ON matches(tournament_id, cup_type) WHERE cup_type IS NOT NULL;
```

### 2. Tournament Store funktioner:
**Fil:** `src/stores/tournament-store.ts`

Lägg till:
```typescript
// Start cup play after Swiss rounds
startCupPlay: async (tournamentId: string) => {
  // 1. Get tournament
  // 2. Split teams into A and B
  // 3. Generate cup matches for both
  // 4. Update currentPhase to 'cup'
  // 5. Save matches to database
}

// Finish tournament (for social boule)
finishTournament: async (tournamentId: string) => {
  // Update currentPhase to 'finished'
}

// Generate next cup round
startNextCupRound: async (tournamentId: string, cupType: 'A' | 'B') => {
  // 1. Get previous round matches
  // 2. Generate next round
  // 3. Save new matches
}
```

### 3. Tournament Page UI:
**Fil:** `src/app/tournament/[id]/page.tsx`

**När currentPhase === 'swiss' och alla ronder klara:**
```tsx
{swissComplete && isAdmin && (
  <Card>
    <CardHeader>
      <CardTitle>🏆 Swiss-ronder är klara!</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Button onClick={finishTournament} size="lg" className="w-full">
          ✅ Avsluta tävling (Social boule)
        </Button>
        <Button onClick={startCupPlay} size="lg" variant="success" className="w-full">
          🏆 Starta Cup-spel (A och B turnering)
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

### 4. Cup Bracket Component:
**Ny fil:** `src/components/cup-bracket.tsx`

Visa:
- Två brackets side-by-side (A och B)
- Klassisk bracket layout (kvartsfinal → semi → final)
- BYE visas tydligt
- Matchresultat
- Vinnare högst upp

### 5. Cup Match Registration:
- Registrera resultat för cup-matcher
- Automatiskt generera nästa rond när rond är klar
- Visa vinnare när final är klar

### 6. Winners Display:
```tsx
{aWinner && (
  <Card className="border-4 border-gold">
    <CardHeader>
      <CardTitle>🥇 A-Turnering Vinnare</CardTitle>
    </CardHeader>
    <CardContent>
      <h2>{aWinner.name}</h2>
    </CardContent>
  </Card>
)}

{bWinner && (
  <Card className="border-4 border-silver">
    <CardHeader>
      <CardTitle>🥈 B-Turnering Vinnare</CardTitle>
    </CardHeader>
    <CardContent>
      <h2>{bWinner.name}</h2>
    </CardContent>
  </Card>
)}
```

---

## 📋 Workflow för Cup:

### Admin flow:
1. **Efter Swiss rond 3:**
   - Se knapp: "Avsluta tävling" ELLER "Starta Cup-spel"

2. **Om "Starta Cup-spel":**
   - Systemet delar automatiskt i A och B
   - Visar brackets för båda turneringarna
   - Admin registrerar matchresultat

3. **Efter varje rond:**
   - Systemet genererar automatiskt nästa rond
   - När någon vinner → Visa vinnare med pokal

### Spelare flow:
- Se vilken turnering de är i (A eller B)
- Följa brackets
- Se vem de ska möta nästa
- Se vinnare när klart

---

## 🎯 Prioritet nästa session:

1. Kör SQL-migration i Neon (2 min)
2. Lägg till tournament store funktioner (15 min)
3. Bygg Cup UI i tournament page (30 min)
4. Bygg bracket component (45 min)
5. Testa! (15 min)

**Total tid:** ~2 timmar

---

## 💡 Design tips:

**A-turnering:**
- Guld-färg: `border-yellow-500`
- Text: "🥇 A-Turnering (Topp-lag)"

**B-turnering:**
- Silver-färg: `border-slate-400`
- Text: "🥈 B-Turnering"

**BYE:**
- Grå bakgrund
- Text: "BYE (Direktkval)"

---

## ✅ Status:
- Backend: 100% klar
- Databas: 90% klar (behöver köra migration)
- UI: 0% klar (startar nästa session)

**Allt är pushat till GitHub!** 🎉
