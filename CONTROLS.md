# 🎮 Controale Complete Snake Game

## ⌨️ Desktop (Tastatură)

### Mișcare în Joc
```
┌─────────────────────────────────────┐
│  Arrow Keys          WASD           │
│  ───────────         ────           │
│      ↑               W              │
│    ← ↓ →          A  S  D           │
│                                     │
│  Ambele seturi funcționează!        │
└─────────────────────────────────────┘
```

### Comenzi Joc
| Tastă | Acțiune |
|-------|---------|
| **Space** | Pauză / Resume |
| **P** | Pauză / Resume (alternativă) |
| **R** | Restart joc |
| **Esc** | Înapoi la meniu |

### Taste Speciale
- **Enter** - Confirmă selecție în meniuri
- **Tab** - Navigare între butoane (acces tastatură)

---

## 📱 Mobile / Tablet (Touch)

### Metoda 1: Swipe
```
┌─────────────────────────────────────┐
│                                     │
│      Swipe în zona de control       │
│                                     │
│         ↑  Swipe sus                │
│         │                           │
│    ← ───┼─── →  Swipe stânga/dreapta│
│         │                           │
│         ↓  Swipe jos                │
│                                     │
│  Distanță minimă: 30px              │
└─────────────────────────────────────┘
```

**Cum să folosești:**
1. Pune degetul în zona de swipe (pătrat gri cu text "Swipe here")
2. Swipe rapid în direcția dorită
3. Șarpele va schimba direcția

### Metoda 2: D-Pad Buttons
```
┌─────────────────────────────────────┐
│                                     │
│              [  ↑  ]                │
│                                     │
│        [  ←  ] [  ↓  ] [  →  ]      │
│                                     │
│  Apasă butoanele direcționale       │
└─────────────────────────────────────┘
```

**Avantaje:**
- Precis și rapid
- Nu necesită gesturi
- Perfect pentru degete mari

### Butoane Acțiune
| Buton | Acțiune |
|-------|---------|
| **Pause** | Pune jocul pe pauză |
| **Resume** | Reia jocul |
| **Restart** | Restart rapid |
| **Menu** | Înapoi la meniu principal |

---

## 🖱️ Mouse (Desktop)

### Clickuri în Joc
- Click pe **Pause** pentru pauză
- Click pe **Restart** pentru restart
- Click pe **Menu** pentru ieșire

### Clickuri în Meniu
- Click pe card-ul modului de joc pentru selecție
- Click pe **Play** pentru start
- Click pe **Settings** pentru setări
- Click pe **High Scores** pentru clasament

---

## 🎯 Tips pentru Control Optim

### Desktop
✅ **Arrow Keys** sunt cele mai rapide pentru control precis  
✅ **WASD** sunt mai ergonomice pentru sesiuni lungi  
✅ **Space** pentru pauză rapidă fără să te miști  
✅ **R** pentru restart instant când mori  

### Mobile
✅ **Swipe** este cel mai rapid pentru schimbări rapide  
✅ **D-pad** este mai precis pentru mișcări controlate  
✅ Folosește **două mâini** pentru control mai bun  
✅ **Portret** orientation pentru vizibilitate optimă  

### Ambele
✅ Nu poți face turnură de 180° (șarpele nu poate merge înapoi în sine)  
✅ Poți buffer următoarea mișcare (apasă rapid două taste pentru cornere)  
✅ Pauza este instantanee - folosește-o strategic!  

---

## 🔄 Buffer de Input

Jocul permite **input buffering** - poți apăsa tasta următoare înainte ca șarpele să termine mișcarea curentă.

**Exemplu:**
```
Șarpele merge DREAPTA (→)
Tu vrei să faci o curbă în sus-dreapta

1. Apasă SUS rapid
2. Apasă DREAPTA imediat după
3. Șarpele va face curba perfectă!
```

Această funcție face jocul mai fluid și permite mișcări rapide fără lag.

---

## ⚡ Shortcut-uri Avansate

### În Joc
| Combinație | Efect |
|------------|-------|
| **Esc → Enter** | Ieșire rapidă și confirmare |
| **R → R** | Double restart (sigur ești mort de tot?) |
| **P → Esc** | Pauză și ieși |

### În Meniu
| Acțiune | Shortcut |
|---------|----------|
| Play rapid | Click mod + Enter |
| Schimbă setări | Click Settings |
| Vezi scoruri | Click High Scores |

---

## 🎮 Control pentru Fiecare Mod

### Classic / Normal Modes
- Control standard cu taste/swipe
- Toate tastele funcționează normal

### Twin Mode (Doi Șerpi)
- **Aceleași taste** controlează AMBII șerpi simultan!
- Gândește-te strategic - șerpii se mișcă în aceeași direcție
- Nu poți controla șerpii independent

### Winged Mode (Cu Aripi)
- Control normal
- Șarpele sare automat peste obstacole

### Arrow Mode (Săgeți)
- Tastele tale sunt OVERWRITE de săgeți
- Când treci peste săgeată, direcția e forțată
- Planifică ahead pentru a evita capcanele!

### Light Mode (Lumină Limitată)
- Control normal
- Vezi doar 4 celule în jurul capului
- Mergi mai încet și cu atenție!

### Toate Celelalte
- Control standard
- Mecanicile speciale nu afectează input-ul

---

## 🔊 Feedback Vizual și Audio

### Când Apeși o Tastă
✅ Șarpele schimbă direcția instantaneu (next frame)  
✅ Nu există delay vizibil  
✅ Animație smooth de rotație  

### Când Mănânci un Măr
✅ Sunet "beep" scurt (C5)  
✅ Mărul dispare instant  
✅ Scorul crește vizibil  
✅ Șarpele crește la următoarea mișcare  

### Când Iei un Powerup
✅ Sunet diferit (E5)  
✅ Indicator vizual (key found, shield active, etc.)  
✅ Efect special (glow pentru shield)  

### Când Mori
✅ Sunet "gameover" (A3)  
✅ Overlay cu scorul final  
✅ Highlight dacă e high score nou  

---

## 🎯 Practică Controalele

### Pentru Începători
1. Începe cu **Classic mode** + **Slow speed**
2. Folosește **Arrow keys** (cele mai intuitive)
3. Practică în **Peaceful mode** (fără game over)
4. Învață să buffer-ezi input-ul pentru curbe

### Pentru Intermediari
1. Treci la **Normal speed**
2. Încearcă **WASD** pentru ergonomie
3. Exersează **Twin mode** pentru coordonare
4. Învață timing-ul pentru **Portal mode**

### Pentru Avansați
1. **Fast speed** + **Large map**
2. Folosește **Space** pentru pauze tactice
3. Master **Arrow mode** (anticipare)
4. Cucerește **Blender mode**!

---

## 🐛 Troubleshooting Control

### Tastele Nu Funcționează?
✅ Verifică că jocul este în focus (click pe fereastră)  
✅ Nu ai alt program care interceptează tastele  
✅ Reîncarcă pagina (F5 sau Ctrl+R)  

### Swipe Nu Merge pe Mobil?
✅ Swipe în zona marcată (pătrat gri)  
✅ Swipe mai lung (minim 30px)  
✅ Swipe mai rapid  
✅ Verifică că nu ai zoom activat  

### Input Lag?
✅ Închide alte tab-uri din browser  
✅ Dezactivează extensii browser  
✅ Verifică FPS (ar trebui să fie constant 60)  
✅ Schimbă viteza în Settings  

### Șarpele Nu Ascultă?
✅ Nu poți face 180° (e normal!)  
✅ Așteaptă următorul frame  
✅ Buffer-ul poate avea max 1 comandă  

---

## 📋 Checklist Control Perfect

Desktop:
- [ ] Am testat Arrow Keys
- [ ] Am testat WASD
- [ ] Am testat Space (pauză)
- [ ] Am testat R (restart)
- [ ] Am testat Esc (meniu)
- [ ] Am învățat să buffer-ez input

Mobile:
- [ ] Am testat Swipe
- [ ] Am testat D-pad buttons
- [ ] Am testat cu două mâini
- [ ] Am găsit metoda preferată
- [ ] Controlez fluid șarpele

General:
- [ ] Înțeleg că nu pot merge înapoi
- [ ] Știu să folosesc pauza strategic
- [ ] Am exersat în Peaceful mode
- [ ] Sunt gata pentru moduri grele!

---

## 🏆 Master Controls = Master Game!

Cu practică, vei putea:
- ⚡ Schimba direcția instantaneu
- 🎯 Face curbe perfecte
- 🔄 Buffer input pentru mișcări complexe
- 🎮 Juca fără să te gândești la taste
- 🏆 Obține high scores în orice mod!

**Pro Tip:** Cei mai buni jucători folosesc o combinație de Arrow Keys pentru mișcare rapidă și Space pentru pauze tactice!

---

🐍 **Happy Playing!** 🎮
