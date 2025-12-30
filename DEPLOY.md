# 🚀 Deploy-guide för BPT till Vercel

## ✅ Checklista innan deploy

- [x] Alla filer sparade
- [x] .gitignore skapad
- [x] README.md skapad
- [x] package.json uppdaterad med korrekt namn
- [ ] Testat lokalt att allt fungerar
- [ ] Byggt production-version

## 📋 Steg-för-steg guide

### 1️⃣ Skapa nytt GitHub repo

1. Gå till https://github.com/new
2. **Repository name:** `bpt-boule-pro` (eller vad du vill)
3. **Description:** "Professionell turneringshantering för boule"
4. **Private eller Public:** Välj själv
5. **VIKTIGT:** Kryssa INTE i "Add README" (vi har redan en!)
6. Klicka "Create repository"

### 2️⃣ Pusha koden till GitHub

Kör dessa kommandon i `next-app/` mappen:

```bash
# Navigera till next-app
cd /Users/admin/Desktop/boule-pro-tavlingar/boule-pro-tavlingar/next-app

# Initiera git
git init

# Lägg till alla filer
git add .

# Första commit
git commit -m "Initial commit - BPT v1.0"

# Lägg till GitHub remote (ersätt USERNAME med ditt GitHub-användarnamn)
git remote add origin https://github.com/USERNAME/bpt-boule-pro.git

# Pusha till GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ Importera till Vercel

#### Alternativ A: Via Vercel Dashboard (enklast)

1. Gå till https://vercel.com/dashboard
2. Klicka "Add New..." → "Project"
3. Klicka "Import Git Repository"
4. Välj ditt nya repo: `bpt-boule-pro`
5. **Project Name:** Skriv **"BPT"** (eller "bpt")
6. **Framework Preset:** Next.js (auto-detect)
7. **Root Directory:** Lämna tom (`.`)
8. Klicka "Deploy"

#### Alternativ B: Via Vercel CLI

```bash
# Installera Vercel CLI (om du inte har det)
npm i -g vercel

# Logga in
vercel login

# Deploy från next-app mappen
vercel --name bpt

# Följ prompts:
# - Link to existing project? No
# - Project name: bpt
# - Deploy? Yes
```

### 4️⃣ Efter deploy

Din app kommer vara live på:
- **Production:** `https://bpt.vercel.app` (eller `bpt-username.vercel.app`)

Vercel kommer automatiskt:
- ✅ Bygga din app
- ✅ Deploya till CDN
- ✅ Ge dig HTTPS
- ✅ Auto-deploya vid varje git push

## 🔧 Viktiga inställningar i Vercel

Efter första deployen, gå till Project Settings:

1. **General → Project Name:** "BPT"
2. **Domains:** Kan lägga till custom domain senare
3. **Environment Variables:** Inga behövs för tillfället

## ⚠️ OBS: Data

**IndexedDB är lokal till varje domän!**

Det betyder:
- localhost:3001 = egen data
- bpt.vercel.app = egen data
- Gamla appen = egen data

Data kopieras INTE automatiskt mellan domäner.

## 🐛 Troubleshooting

### Build error på Vercel?

1. Testa bygget lokalt först:
   ```bash
   npm run build
   ```
2. Om det funkar lokalt men inte på Vercel, kolla Node-version:
   - Vercel använder Node 18+ som default
   - Funkar med vår app!

### Tailwind CSS fungerar inte?

- Kolla att `postcss.config.js` och `tailwind.config.js` finns
- Kolla att `globals.css` har rätt imports

## ✅ Success!

När allt är klart har du:
- ✅ Kod på GitHub
- ✅ Live app på Vercel (bpt.vercel.app)
- ✅ Auto-deploys vid varje push
- ✅ HTTPS gratis
- ✅ Professionell URL

---

**Lycka till!** 🚀
