# 🐍 Snake Game - Modern & Professional

Un joc Snake complet, modern, inspirat de Google Snake, cu 22 de moduri de joc diferite, animații fluide și control impecabil.

## 🎮 Caracteristici

### Moduri de Joc (22 total)

1. **Classic** - Jocul clasic Snake
2. **Wall** - Navighează în jurul pereților randomizați
3. **Portal** - Teleportare prin portale
4. **Cheese** - Colectează brânză în secvență
5. **Borderless** - Fără pereți, treci prin margini
6. **Twin** - Controlează doi șerpi simultan
7. **Winged** - Sări peste obstacole
8. **Yin Yang** - Două zone cu reguli diferite
9. **Key** - Găsește cheia pentru a debloca mere
10. **Sokoban** - Împinge cutii pentru a ajunge la mere
11. **Poison** - Evită merele otrăvite
12. **Dimension** - Șarpele crește și se micșorează
13. **Minesweeper** - Evită minele ascunse
14. **Statue** - Navighează printre statui
15. **Light** - Vizibilitate limitată în jurul șarpelui
16. **Shield** - Scuturi temporare de invincibilitate
17. **Arrow** - Urmează săgețile de direcție
18. **Hotdog** - Mecanică specială de creștere
19. **Magnet** - Merele se mișcă către tine
20. **Gate** - Porți care se deschid și închid
21. **Peaceful** - Fără game over, doar distracție
22. **Blender** - Mix de toate mecanicile

### Setări Configurabile

- **Viteza**: Slow / Normal / Fast
- **Număr mere**: 1-5 mere simultan
- **Dimensiune hartă**: Small (15x15) / Medium (20x20) / Large (25x25)
- **Temă**: Light / Dark
- **Sunet**: On / Off

### Controale

**Desktop:**
- Arrow Keys (↑ ↓ ← →) sau WASD pentru mișcare
- Space sau P pentru pauză
- R pentru restart
- Esc pentru meniu

**Mobile:**
- Swipe în zona de control
- Butoane on-screen (D-pad)
- Touch controls optimizate

## 📁 Structura Proiectului

```
/src/app/
├── types/
│   └── game.ts              # Type definitions pentru toate entitățile
├── utils/
│   └── gameHelpers.ts       # Funcții helper pentru logica jocului
├── hooks/
│   └── useGameLogic.ts      # Hook principal pentru game loop
├── components/
│   ├── GameBoard.tsx        # Board-ul de joc cu rendering
│   └── TouchControls.tsx    # Controale touch pentru mobil
├── pages/
│   ├── Menu.tsx            # Meniul principal
│   ├── Settings.tsx        # Pagina de setări
│   └── Game.tsx            # Pagina principală de joc
├── routes.tsx              # Configurare React Router
└── App.tsx                 # Entry point

/src/styles/
├── theme.css               # Stiluri și teme
└── tailwind.css            # Configurare Tailwind
```

## 🎨 Placeholdere pentru Assets Custom

### 1. Cap de Șarpe (Snake Head)

**Locație:** `/src/app/components/GameBoard.tsx` - linia ~241

```tsx
{isHead && (
  // PLACEHOLDER: Replace cu imaginea custom pentru capul șarpelui
  <div className="w-2 h-2 bg-white rounded-full opacity-70" />
)}
```

**Cum să adaugi imagine custom:**

```tsx
{isHead && (
  <img 
    src="/path/to/snake-head.png" 
    alt="Snake Head"
    className="w-full h-full object-contain"
    style={{ 
      transform: `rotate(${getHeadRotation(snake.direction)}deg)` 
    }}
  />
)}

// Adaugă funcția pentru rotație:
function getHeadRotation(direction: Direction): number {
  switch (direction) {
    case 'UP': return 0;
    case 'RIGHT': return 90;
    case 'DOWN': return 180;
    case 'LEFT': return 270;
  }
}
```

### 2. Fructe / Mere (Apples)

**Locație:** `/src/app/components/GameBoard.tsx` - linia ~203

```tsx
{/* PLACEHOLDER: Replace with custom fruit images */}
<div className="w-3 h-3 bg-white rounded-full opacity-30" />
```

**Cum să adaugi imagini custom pentru fructe:**

```tsx
// În loc de placeholder-ul circular, adaugă:
<img 
  src={getAppleImage(apple.type)} 
  alt="Apple"
  className="w-full h-full object-contain"
/>

// Funcție helper pentru diferite tipuri de mere:
function getAppleImage(type: Apple['type']): string {
  switch (type) {
    case 'normal':
      return '/assets/apple-red.png';
    case 'golden':
      return '/assets/apple-gold.png';
    case 'poison':
      return '/assets/apple-poison.png';
    case 'cheese':
      return '/assets/cheese.png';
    default:
      return '/assets/apple-red.png';
  }
}
```

### 3. Corp de Șarpe (Snake Body)

**Locație:** `/src/app/components/GameBoard.tsx` - liniile ~230-248

```tsx
// Pentru fiecare segment de corp, poți adăuga pattern/textură:
<div
  style={{
    ...getCellStyle(segment.x, segment.y),
    backgroundColor: isHead ? 'rgb(34, 197, 94)' : 'rgb(74, 222, 128)',
    // Adaugă backgroundImage pentru textură:
    backgroundImage: isHead ? "url('/assets/snake-head-texture.png')" : "url('/assets/snake-body-texture.png')",
    backgroundSize: 'cover',
  }}
/>
```

### 4. Alte Entități (Opțional)

În `GameBoard.tsx` linia ~166-182, există emoji-uri pentru entități. Le poți înlocui cu imagini:

```tsx
{entity.type === 'key' && <img src="/assets/key.png" className="w-full h-full" />}
{entity.type === 'box' && <img src="/assets/box.png" className="w-full h-full" />}
{entity.type === 'mine' && <img src="/assets/mine.png" className="w-full h-full" />}
{entity.type === 'shield' && <img src="/assets/shield.png" className="w-full h-full" />}
```

## 🚀 Cum să Rulezi Jocul

1. **Instalare dependențe** (dacă nu sunt deja instalate):
   ```bash
   npm install
   # sau
   pnpm install
   ```

2. **Pornire development server**:
   ```bash
   npm run dev
   # sau
   pnpm dev
   ```

3. **Build pentru producție**:
   ```bash
   npm run build
   # sau
   pnpm build
   ```

## 🎯 Gameplay - Reguli pe Moduri

### Classic
Standard Snake - colectează mere, crește, evită pereții și corpul propriu.

### Wall
Pereți randomizați pe hartă - trebuie să navighezi în jurul lor.

### Portal
Portale violet (intrare) și roz (ieșire) - teleportare instantanee.

### Cheese
5 bucăți de brânză - trebuie colectate în ordine numerică (0-4).

### Borderless
Fără margini - când ieși pe o parte, apari pe partea opusă.

### Twin
Doi șerpi - verde și albastru, controlați simultan cu aceleași comenzi.

### Winged
Poți sări peste obstacole - sări automat peste pereți/statui.

### Yin Yang
Două zone circulare - yin (alb) și yang (negru) cu efecte speciale.

### Key
Trebuie să găsești cheia 🔑 înainte de a putea mânca mere.

### Sokoban
Cutii 📦 pe hartă - le poți împinge pentru a-ți face drum.

### Poison
Mere otrăvite (violet) - evită-le sau folosește scutul.

### Dimension
La fiecare măr, dimensiunea șarpelui se schimbă (1x, 2x, 3x).

### Minesweeper
Mine 💣 ascunse pe hartă - evită-le cu atenție.

### Statue
Statui fixe pe hartă - navighează printre ele.

### Light
Vizibilitate limitată - vezi doar 4 celule în jurul șarpelui.

### Shield
Scuturi 🛡️ pe hartă - colectează pentru 3 secunde de invincibilitate.

### Arrow
Săgeți pe hartă - forțează schimbarea direcției când treci peste ele.

### Hotdog
Creștere aleatorie - uneori crești, alteori nu, când mănânci mere.

### Magnet
Merele se mișcă către tine când ești aproape.

### Gate
Porți care se deschid/închid - unele sunt active (periculoase), altele inactive.

### Peaceful
Fără game over - treci prin pereți și prin tine însuți fără să mori.

### Blender
Mix de toate mecanicile - cel mai challenging mod!

## 💾 Salvare Date

Jocul salvează automat în `localStorage`:
- **High scores** pentru fiecare mod: `snake-high-scores`
- **Setări**: `snake-settings`

## 🎨 Personalizare Teme

Temele sunt gestionate prin Tailwind CSS și `theme.css`. Pentru a personaliza:

1. **Culori snake**: `/src/app/components/GameBoard.tsx` - liniile cu `backgroundColor`
2. **Culori fundal**: `/src/app/pages/*.tsx` - clasele `bg-gradient-to-br`
3. **Theme toggle**: Automat prin Dark Mode (apasă pe Settings)

## 🔧 Extindere cu Moduri Noi

Pentru a adăuga un nou mod de joc:

1. **Adaugă tipul în** `/src/app/types/game.ts`:
   ```typescript
   export type GameMode = 'classic' | 'wall' | ... | 'your-new-mode';
   ```

2. **Adaugă numele și descrierea**:
   ```typescript
   export const GAME_MODE_NAMES: Record<GameMode, string> = {
     ...
     'your-new-mode': 'Your Mode Name',
   };
   ```

3. **Implementează logica în** `/src/app/hooks/useGameLogic.ts`:
   - În `initializeGame()` - setup inițial
   - În `moveSnake()` - comportament la fiecare frame

4. **Adaugă rendering special în** `/src/app/components/GameBoard.tsx` (dacă e necesar)

## 📱 Responsive Design

Jocul este complet responsive:
- **Desktop**: Control cu tastatură, layout large
- **Tablet**: Control touch + tastatură, layout mediu
- **Mobile**: Control touch exclusiv, layout compact

## 🐛 Debugging

Pentru debugging, verifică consolă:
- Erori de coliziune
- Update-uri de scor
- Sound feedback

## 📄 Licență

Cod liber de utilizat pentru proiecte personale și educaționale.

---

## 🎉 Enjoy Playing!

Dacă găsești bug-uri sau ai sugestii, modifică codul - este complet modular și bine structurat!

**Made with ❤️ for Snake lovers**
