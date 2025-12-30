# 🚨 Tävlingsledningen - Instruktioner

## Så fungerar det

### För deltagare (spelare)
- Klicka på den **röda knappen "Tävlingsledningen"** på startsidan
- Läs viktiga meddelanden från tävlingsledningen
- Knappen **lyser rött** när det finns nya olästa meddelanden
- Alla meddelanden markeras som lästa automatiskt när du öppnar sidan

### För tävlingsledningen
1. Klicka på **"🔐 Tävlingsledning"** knappen på Tävlingsledning-sidan
2. Ange PIN-kod: **1234**
3. Nu kan du skapa nya meddelanden med tre olika prioritetsnivåer:
   - 📢 **Normal** - Allmän information
   - ⚠️ **Viktigt** - Uppmärksamhet krävs
   - 🚨 **Brådskande** - Akut information
4. Meddelanden kan kopplas till en specifik turnering eller vara generella
5. Klicka på **"👁️ Visa meddelanden"** för att logga ut från admin-läge

## Ändra PIN-kod

PIN-koden är för närvarande: **1234**

För att ändra PIN-koden, öppna filen:
```
src/app/tavlingsledningen/page.tsx
```

Hitta raden:
```typescript
const ADMIN_PIN = '1234';
```

Ändra till din egen PIN-kod:
```typescript
const ADMIN_PIN = 'DIN_NYA_PIN';
```

## Exempel på meddelanden

### Brådskande regel
```
Titel: Telefoner under match
Prioritet: 🚨 Brådskande
Meddelande: Det är INTE tillåtet att prata eller uppehålla sig med telefon
under pågående match. Respektera spelarna och deras fokus!
```

### Viktig information
```
Titel: Information mellan matcher
Prioritet: ⚠️ Viktigt
Meddelande: Mellan matcherna - ta del av information via mobilen.
Var tyst och håll avstånd från pågående matcher så att spelarna
inte tappar fokus.
```

### Normal information
```
Titel: Lottning rond 2
Prioritet: 📢 Normal
Turnering: Sommar-cupen 2024
Meddelande: Lottning för rond 2 börjar kl 14:00. Kontrollera tavlan!
```

## Säkerhet

- Endast personer med PIN-kod kan skapa meddelanden
- Deltagare kan **bara läsa** meddelanden
- Admin-läge kräver inloggning varje gång
- PIN-koden visas aldrig för deltagare
