# 🚀 START AICI - Ghid Rapid Snake Game

## ✅ Ce ai primit

Un joc **Snake complet și profesional** pentru WEB (React), nu React Native, dar funcționează perfect pe desktop ȘI mobil prin browser!

### 🎮 Caracteristici complete:
✅ 22 de moduri de joc diferite (Classic, Portal, Twin, Poison, etc.)  
✅ Control perfect: Arrow keys, WASD (desktop) + Touch/Swipe (mobil)  
✅ UI minimalist inspirat de Google Snake  
✅ Animații fluide  
✅ High scores salvate local  
✅ Setări complete (viteză, dimensiune hartă, nr. mere)  
✅ Theme switch (Light/Dark)  
✅ Sound effects opționale  
✅ Responsive design (adaptare automată desktop/mobile)  
✅ **Placeholdere pentru assets custom** (cap șarpe, fructe)  
✅ Cod modular și extensibil  

---

## 🎯 Cum să Rulezi Jocul

### 1️⃣ Verifică că ai toate dependențele:
Toate pachetele necesare sunt deja în `package.json`. Nu trebuie să instalezi nimic nou!

### 2️⃣ Pornește aplicația:
```bash
npm run dev
# sau
pnpm dev
```

### 3️⃣ Deschide în browser:
```
http://localhost:5173
```

### 4️⃣ Joacă!
- Alege un mod de joc din meniu
- Apasă "Play"
- Desktop: Folosește săgețile sau WASD
- Mobil: Swipe sau apasă butoanele on-screen

---

## 📂 Structura Proiectului

```
/src/app/
├── types/game.ts           # Toate type-urile pentru joc
├── utils/gameHelpers.ts    # Funcții helper (coliziuni, spawn, etc.)
├── hooks/useGameLogic.ts   # Logica principală de joc (game loop)
├── components/
│   ├── GameBoard.tsx       # Componenta board-ului de joc
│   ├── TouchControls.tsx   # Controale touch pentru mobil
│   └── ModeSelector.tsx    # Selector moduri de joc
├── pages/
│   ├── Menu.tsx           # Meniul principal
│   ├── Game.tsx           # Pagina de joc
│   ├── Settings.tsx       # Setări
│   └── HighScores.tsx     # Clasament high scores
├── routes.tsx             # Configurare rute
└── App.tsx                # Entry point

/GAME_README.md            # Documentație completă
/CUSTOM_ASSETS_GUIDE.md    # Ghid pentru adăugare imagini custom
/START_AICI.md             # Acest fișier
```

---

## 🎨 Cum să Adaugi Imagini Custom

### Placeholdere existente:

1. **Cap de șarpe** - `/src/app/components/GameBoard.tsx` linia ~241
2. **Fructe/mere** - `/src/app/components/GameBoard.tsx` linia ~203
3. **Corp șarpe** - Opțional, cu texturi
4. **Entități** (cheie, cutie, etc.) - linia ~166

### Pași rapizi:

1. Creează folder `/public/assets/`
2. Adaugă imaginile tale (PNG 64x64px recomandat)
3. Urmează ghidul din **`/CUSTOM_ASSETS_GUIDE.md`** (foarte detaliat!)

**Exemplu rapid pentru cap de șarpe:**

```tsx
// În GameBoard.tsx, găsește:
{isHead && (
  <div className="w-2 h-2 bg-white rounded-full opacity-70" />
)}

// Înlocuiește cu:
{isHead && (
  <img 
    src="/assets/snake-head.png" 
    alt="Snake Head"
    className="w-full h-full object-contain"
  />
)}
```

**Citește `/CUSTOM_ASSETS_GUIDE.md` pentru detalii complete!**

---

## 🎮 Moduri de Joc Disponibile

### 🌱 Beginner (3)
1. **Classic** - Snake clasic standard
2. **Borderless** - Fără margini, wrap-around
3. **Peaceful** - Fără game over, relaxant

### 🎯 Intermediate (6)
4. **Wall** - Pereți randomizați
5. **Statue** - Obstacole fixe
6. **Portal** - Teleportare prin portale
7. **Gate** - Porți care se deschid/închid
8. **Cheese** - Colectează brânză în ordine
9. **Poison** - Evită mere otrăvite

### ⚡ Advanced (5)
10. **Key** - Găsește cheia pentru mere
11. **Sokoban** - Împinge cutii
12. **Twin** - Controlează doi șerpi
13. **Winged** - Sări peste obstacole
14. **Yin Yang** - Două zone speciale

### 🔥 Expert (8)
15. **Dimension** - Schimbă dimensiunea șarpelui
16. **Minesweeper** - Evită mine
17. **Light** - Vizibilitate limitată
18. **Shield** - Scuturi temporare
19. **Arrow** - Săgeți de direcție
20. **Hotdog** - Creștere aleatorie
21. **Magnet** - Merele vin către tine
22. **Blender** - Mix de toate mecanicile!

---

## ⚙️ Setări Disponibile

Accesează din meniul principal → "Settings"

- **Game Speed**: Slow / Normal / Fast
- **Map Size**: Small (15x15) / Medium (20x20) / Large (25x25)
- **Apple Count**: 1-5 mere simultan
- **Theme**: Light / Dark
- **Sound Effects**: On / Off

Setările se salvează automat în `localStorage`.

---

## 🎯 Controale

### Desktop
- **Arrow Keys** (↑ ↓ ← →) - Mișcare
- **WASD** - Mișcare alternativă
- **Space / P** - Pauză
- **R** - Restart
- **Esc** - Back to menu

### Mobile
- **Swipe** - Mișcare (zona de swipe)
- **D-pad buttons** - Butoane direcționale
- **Touch buttons** - Pauză/Restart

---

## 🏆 High Scores

- Salvate automat pentru fiecare mod de joc
- Accesează din meniu → "High Scores"
- Statistici complete: best score, average, total points
- Opțiune de reset (Clear Scores)

---

## 🔧 Extindere cu Moduri Noi

Vrei să adaugi un mod custom? Este foarte simplu!

### Pași:

1. **Adaugă tipul** în `/src/app/types/game.ts`:
```typescript
export type GameMode = 'classic' | 'wall' | ... | 'your-mode';
```

2. **Adaugă nume și descriere**:
```typescript
export const GAME_MODE_NAMES = {
  'your-mode': 'Your Mode Name',
};

export const GAME_MODE_DESCRIPTIONS = {
  'your-mode': 'Description of your mode',
};
```

3. **Implementează logica** în `/src/app/hooks/useGameLogic.ts`:
   - `initializeGame()` - setup inițial (entități, reguli)
   - `moveSnake()` - comportament la fiecare frame

4. **Testează!**

Codul este foarte modular și ușor de extins.

---

## 📱 Responsive Design

Jocul se adaptează automat:

- **Desktop**: Board mare (20px/celulă), control cu tastatură
- **Tablet**: Board mediu, touch + tastatură
- **Mobile**: Board mic (15px/celulă), touch controls

Totul este testat și funcționează perfect!

---

## 🐛 Troubleshooting

### Jocul nu pornește?
```bash
# Reinstalează dependențele
npm install
# sau
pnpm install

# Pornește din nou
npm run dev
```

### Imaginile custom nu se văd?
- Verifică că sunt în `/public/assets/`
- Path-urile trebuie să înceapă cu `/assets/`
- Verifică consolă pentru erori 404

### Control lag pe mobil?
- Actualizează browser-ul
- Închide alte tab-uri
- Verifică că viteza este setată corect în Settings

### High scores nu se salvează?
- Verifică că browser-ul permite localStorage
- Nu folosi "Incognito/Private mode"

---

## 📚 Documentație Completă

Pentru detalii aprofundate:

1. **`/GAME_README.md`** - Documentație tehnică completă
2. **`/CUSTOM_ASSETS_GUIDE.md`** - Ghid detaliat pentru imagini custom
3. **`/src/app/types/game.ts`** - Toate type-urile și interfețele
4. **`/src/app/hooks/useGameLogic.ts`** - Logica jocului (bine comentată)

---

## 🎉 Tips & Tricks

### Pentru Jucători:
- În **Portal mode**, folosește portalele strategic pentru evitări rapide
- În **Cheese mode**, planifică traseul pentru secvență
- În **Light mode**, mergi mai încet și planifică ahead
- În **Twin mode**, gândește în perechi de mișcări
- În **Peaceful mode**, exersează fără presiune!

### Pentru Developeri:
- Toate helper functions sunt în `gameHelpers.ts`
- Game loop-ul este în `useGameLogic.ts` - foarte curat
- Pentru debug, adaugă `console.log` în `moveSnake()`
- Sound effects folosesc Web Audio API (simplu)
- Animațiile folosesc CSS transitions (performanță maximă)

---

## 🚀 Next Steps

1. ✅ **Testează toate modurile** - vezi care îți place cel mai mult
2. 🎨 **Adaugă assets custom** - fa jocul să fie al tău!
3. 🔧 **Creează un mod nou** - experimentează cu logica
4. 🌍 **Deploy** - publică pe Vercel/Netlify
5. 🎮 **Joacă și distrează-te!**

---

## 📞 Suport

Dacă ai întrebări:
1. Citește **`/GAME_README.md`** - răspunde la 90% din întrebări
2. Verifică codul - este bine comentat
3. Consolă browser (F12) - vezi erori

---

## 💚 Final Notes

Ai primit un joc **Snake profesional și complet**:
- ✅ 22 moduri de joc
- ✅ UI modern și plăcut
- ✅ Control perfect desktop + mobil
- ✅ Cod curat și extensibil
- ✅ Placeholdere pentru custom assets
- ✅ Documentație completă

**Jocul este 100% functional și gata de jucat!**

Doar rulează `npm run dev` și începe să te distrezi! 🐍🎮

---

**Made with ❤️ - Enjoy playing Snake!** 🐍✨
