# 🎨 Ghid pentru Adăugarea de Assets Custom

Acest ghid te ajută să înlocuiești elementele grafice placeholder cu propriile imagini custom pentru capul șarpelui, fructe și alte elemente de joc.

## 📦 Organizare Assets

Creează următoarea structură de foldere în proiect:

```
/public/
  /assets/
    /snake/
      snake-head.png         # Cap de șarpe (principal)
      snake-head-green.png   # Cap pentru șarpele principal (Twin mode)
      snake-head-blue.png    # Cap pentru al doilea șarpe (Twin mode)
      snake-body-texture.png # Textură pentru corp (opțional)
    /fruits/
      apple-red.png          # Măr roșu normal
      apple-golden.png       # Măr de aur (bonus)
      apple-poison.png       # Măr otrăvit (violet)
      cheese.png             # Brânză (Cheese mode)
    /entities/
      key.png               # Cheie (Key mode)
      box.png               # Cutie (Sokoban mode)
      mine.png              # Mină (Minesweeper mode)
      shield.png            # Scut (Shield mode)
      statue.png            # Statuie (Statue mode)
      portal-entrance.png   # Portal intrare
      portal-exit.png       # Portal ieșire
      gate-open.png         # Poartă deschisă
      gate-closed.png       # Poartă închisă
```

## 🐍 1. Capul Șarpelui

### Locație: `/src/app/components/GameBoard.tsx` (linia ~241)

**Găsește acest cod:**

```tsx
{isHead && (
  // PLACEHOLDER: Replace cu imaginea custom pentru capul șarpelui
  <div className="w-2 h-2 bg-white rounded-full opacity-70" />
)}
```

**Înlocuiește cu:**

```tsx
{isHead && (
  <img 
    src="/assets/snake/snake-head.png" 
    alt="Snake Head"
    className="w-full h-full object-contain"
    style={{ 
      transform: `rotate(${getHeadRotation(snake.direction)}deg)`,
      transition: 'transform 0.1s ease',
    }}
  />
)}
```

**Adaugă funcția de rotație (înainte de `return` din componenta `GameBoard`):**

```tsx
const getHeadRotation = (direction: Direction): number => {
  switch (direction) {
    case 'UP': return 0;
    case 'RIGHT': return 90;
    case 'DOWN': return 180;
    case 'LEFT': return 270;
  }
};
```

### Specificații imagine cap șarpe:
- **Dimensiune recomandată**: 64x64 px sau 128x128 px
- **Format**: PNG cu transparență
- **Orientare**: Șarpele trebuie să privească în SUS (↑) în imaginea originală
- **Detalii**: Ochii, gura, limba (opțional)

---

## 🍎 2. Fructele / Merele

### Locație: `/src/app/components/GameBoard.tsx` (linia ~203)

**Găsește acest cod:**

```tsx
{/* PLACEHOLDER: Replace with custom fruit images */}
<div className="w-3 h-3 bg-white rounded-full opacity-30" style={{ marginTop: '-4px', marginLeft: '-2px' }} />
```

**Înlocuiește cu:**

```tsx
<img 
  src={getAppleImage(apple.type)} 
  alt={apple.type}
  className="w-full h-full object-contain"
/>
```

**Adaugă funcția helper (la începutul componentei `GameBoard`):**

```tsx
const getAppleImage = (type: Apple['type']): string => {
  switch (type) {
    case 'normal':
      return '/assets/fruits/apple-red.png';
    case 'golden':
      return '/assets/fruits/apple-golden.png';
    case 'poison':
      return '/assets/fruits/apple-poison.png';
    case 'cheese':
      return '/assets/fruits/cheese.png';
    default:
      return '/assets/fruits/apple-red.png';
  }
};
```

### Specificații imagini fructe:
- **Dimensiune recomandată**: 64x64 px
- **Format**: PNG cu transparență
- **Stil**: Colorat, cartoon sau realist
- **Culori sugerate**:
  - Măr normal: Roșu (#EF4444)
  - Măr de aur: Auriu (#EAB308)
  - Măr otrăvit: Violet/Mov (#9333EA)
  - Brânză: Galben (#FFC107)

---

## 🎯 3. Corp de Șarpe (Opțional - Textură)

### Locație: `/src/app/components/GameBoard.tsx` (linia ~230)

**Găsește blocul care renderează body segments:**

```tsx
<div
  key={`snake-${idx}`}
  style={{
    ...getCellStyle(segment.x, segment.y),
    backgroundColor: isHead ? 'rgb(34, 197, 94)' : 'rgb(74, 222, 128)',
    // ... alte stiluri
  }}
/>
```

**Adaugă textură:**

```tsx
<div
  key={`snake-${idx}`}
  style={{
    ...getCellStyle(segment.x, segment.y),
    backgroundColor: isHead ? 'rgb(34, 197, 94)' : 'rgb(74, 222, 128)',
    backgroundImage: !isHead ? "url('/assets/snake/snake-body-texture.png')" : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // ... alte stiluri
  }}
/>
```

### Specificații textură corp:
- **Dimensiune**: 32x32 px sau 64x64 px (seamless/tileable)
- **Format**: PNG cu transparență parțială
- **Stil**: Pattern de solzi, gradient verde, sau solid cu highlight

---

## 🔑 4. Entități de Joc (Key, Box, Mine, etc.)

### Locație: `/src/app/components/GameBoard.tsx` (linia ~166)

**Găsește codul pentru entități:**

```tsx
{entity.type === 'key' && '🔑'}
{entity.type === 'box' && '📦'}
{entity.type === 'mine' && '💣'}
{entity.type === 'shield' && '🛡️'}
```

**Înlocuiește cu imagini:**

```tsx
{entity.type === 'key' && <img src="/assets/entities/key.png" className="w-full h-full object-contain" alt="Key" />}
{entity.type === 'box' && <img src="/assets/entities/box.png" className="w-full h-full object-contain" alt="Box" />}
{entity.type === 'mine' && <img src="/assets/entities/mine.png" className="w-full h-full object-contain" alt="Mine" />}
{entity.type === 'shield' && <img src="/assets/entities/shield.png" className="w-full h-full object-contain" alt="Shield" />}
{entity.type === 'statue' && <img src="/assets/entities/statue.png" className="w-full h-full object-contain" alt="Statue" />}
```

### Specificații entități:
- **Dimensiune**: 64x64 px
- **Format**: PNG cu transparență
- **Stil**: Consistent cu tema jocului

---

## 🌀 5. Portale

### Locație: `/src/app/components/GameBoard.tsx` (linia ~143)

**Găsește codul pentru portale:**

```tsx
<div
  style={{
    ...getCellStyle(portal.entrance.x, portal.entrance.y),
    backgroundColor: 'rgba(138, 43, 226, 0.6)',
    boxShadow: '0 0 10px rgba(138, 43, 226, 0.8)',
    borderRadius: '50%',
  }}
/>
```

**Înlocuiește cu imagini animate (opțional):**

```tsx
<div
  style={{
    ...getCellStyle(portal.entrance.x, portal.entrance.y),
    backgroundImage: "url('/assets/entities/portal-entrance.png')",
    backgroundSize: 'cover',
    borderRadius: '50%',
    animation: 'portal-spin 2s linear infinite',
  }}
/>

<div
  style={{
    ...getCellStyle(portal.exit.x, portal.exit.y),
    backgroundImage: "url('/assets/entities/portal-exit.png')",
    backgroundSize: 'cover',
    borderRadius: '50%',
    animation: 'portal-spin 2s linear infinite reverse',
  }}
/>
```

**Adaugă animația CSS în `/src/styles/theme.css`:**

```css
@layer base {
  @keyframes portal-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
```

---

## 🎨 6. Twin Mode - Doi Șerpi

Pentru Twin mode, al doilea șarpe este albastru. Poți folosi o imagine diferită:

**Găsește codul pentru al doilea șarpe (linia ~260):**

```tsx
{secondSnake && secondSnake.body.map((segment, idx) => {
  const isHead = idx === 0;
  return (
    <div key={`snake2-${idx}`} ...>
      {isHead && <div className="w-2 h-2 bg-white rounded-full opacity-70" />}
    </div>
  );
})}
```

**Înlocuiește placeholder-ul cu:**

```tsx
{isHead && (
  <img 
    src="/assets/snake/snake-head-blue.png" 
    alt="Second Snake Head"
    className="w-full h-full object-contain"
    style={{ 
      transform: `rotate(${getHeadRotation(secondSnake.direction)}deg)`,
    }}
  />
)}
```

---

## 🚀 Import dinamic și optimizare

Pentru performanță mai bună, poți folosi un sistem de cache pentru imagini:

**Creează un fișier `/src/app/utils/imageCache.ts`:**

```typescript
export const imageCache: Record<string, HTMLImageElement> = {};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (imageCache[src]) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache[src] = img;
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadGameAssets = async () => {
  const assets = [
    '/assets/snake/snake-head.png',
    '/assets/fruits/apple-red.png',
    '/assets/fruits/apple-golden.png',
    '/assets/fruits/apple-poison.png',
    '/assets/fruits/cheese.png',
    '/assets/entities/key.png',
    '/assets/entities/shield.png',
    // ... alte assets
  ];

  await Promise.all(assets.map(preloadImage));
};
```

**Folosește în `/src/app/pages/Game.tsx`:**

```tsx
import { preloadGameAssets } from '../utils/imageCache';

useEffect(() => {
  preloadGameAssets();
}, []);
```

---

## ✅ Checklist pentru Assets

- [ ] Cap șarpe (64x64 PNG, orientare SUS)
- [ ] Măr roșu normal
- [ ] Măr de aur (bonus)
- [ ] Măr otrăvit (violet)
- [ ] Brânză (Cheese mode)
- [ ] Cheie (Key mode)
- [ ] Cutie (Sokoban mode)
- [ ] Mină (Minesweeper mode)
- [ ] Scut (Shield mode)
- [ ] Textură corp șarpe (opțional)
- [ ] Portal intrare + ieșire (opțional)
- [ ] Al doilea cap șarpe pentru Twin mode (opțional)

---

## 🎯 Resurse Gratuite pentru Assets

### Imagini:
- **OpenGameArt.org** - Assets gratuite pentru jocuri
- **Kenney.nl** - Pack-uri de assets gratuite
- **Itch.io** - Asset packs pentru jocuri 2D

### Creează propriile assets:
- **Piskel** (piskelapp.com) - Editor pixel art online
- **Aseprite** - Software profesional pentru pixel art
- **GIMP** - Editor imagini gratuit

### Dimensiuni standard pentru pixel art:
- 16x16, 32x32, 64x64, 128x128 px

---

## 🐛 Troubleshooting

**Problema**: Imaginile nu se încarcă
- Verifică path-urile (trebuie să înceapă cu `/assets/`)
- Asigură-te că imaginile sunt în folder-ul `/public/assets/`
- Verifică consolă pentru erori 404

**Problema**: Imaginile sunt prea mari/mici
- Ajustează `className="w-full h-full object-contain"`
- Sau folosește `style={{ width: '80%', height: '80%' }}`

**Problema**: Capul șarpelui nu se rotește corect
- Verifică orientarea imaginii originale (trebuie SUS)
- Asigură-te că funcția `getHeadRotation` este definită

---

**Success! 🎉** Acum jocul tău Snake are grafică custom și arată profesionist!
