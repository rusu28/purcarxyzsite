import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Lock, Radiation, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type Phase = 'menu' | 'play' | 'gameover' | 'won';

type Viewport = {
  width: number;
  height: number;
  dpr: number;
};

type Layout = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

type UraniumRod = {
  x: number;
  y: number;
  speed: number;
  spin: number;
};

type Choice = {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

const SECRET_PASSWORD = 'purcar';
const UNLOCK_KEY = 'secret-unlocked';
const BEST_SCORE_KEY = 'secret-uranium-best-score';
const GAME_WIDTH = 668;
const GAME_HEIGHT = 480;
const TRACK_MIN_X = 96;
const TRACK_MAX_X = 491;
const CRATE_WIDTH = 106;
const CRATE_HEIGHT = 75;
const CRATE_Y = GAME_HEIGHT - CRATE_HEIGHT - 20;
const ROD_WIDTH = 24;
const ROD_HEIGHT = 62;
const WIN_SCORE = 10000;
const SECRET_START_ASSETS = ['/assets/secret/start-0.jpg', '/assets/secret/start-1.jpg', '/assets/secret/start-2.jpg'];
const SECRET_GIRL_ASSETS = [
  [
    '/assets/secret/girl-0-0.jpg',
    '/assets/secret/girl-0-1.jpg',
    '/assets/secret/girl-0-2.jpg',
    '/assets/secret/girl-0-3.jpg',
    '/assets/secret/girl-0-4.jpg',
    '/assets/secret/girl-0-5.jpg',
  ],
  [
    '/assets/secret/girl-1-0.jpg',
    '/assets/secret/girl-1-1.jpg',
    '/assets/secret/girl-1-2.jpg',
    '/assets/secret/girl-1-3.jpg',
    '/assets/secret/girl-1-4.jpg',
    '/assets/secret/girl-1-5.jpg',
  ],
  [
    '/assets/secret/girl-2-0.jpg',
    '/assets/secret/girl-2-1.jpg',
    '/assets/secret/girl-2-2.jpg',
    '/assets/secret/girl-2-3.jpg',
    '/assets/secret/girl-2-4.jpg',
    '/assets/secret/girl-2-5.jpg',
  ],
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const getStageForScore = (score: number) => {
  if (score >= WIN_SCORE) return 5;
  if (score >= 8000) return 4;
  if (score >= 6000) return 3;
  if (score >= 4000) return 2;
  if (score >= 2000) return 1;
  return 0;
};

const getStoredBestScore = () => {
  if (typeof localStorage === 'undefined') return 0;
  return Number(localStorage.getItem(BEST_SCORE_KEY) ?? '0');
};

export const Secret: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const layoutRef = useRef<Layout>({ offsetX: 0, offsetY: 0, scale: 1 });
  const viewportRef = useRef<Viewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  });

  const phaseRef = useRef<Phase>('menu');
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(getStoredBestScore());
  const livesRef = useRef(3);
  const stageRef = useRef(0);
  const rodsRef = useRef<UraniumRod[]>([]);
  const nextSpawnRef = useRef(0);
  const pauseMsRef = useRef(0);
  const crateXRef = useRef(TRACK_MIN_X + (TRACK_MAX_X - TRACK_MIN_X - CRATE_WIDTH) / 2);
  const cursorRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const selectedCharacterRef = useRef(0);
  const choicesRef = useRef<Choice[]>([]);
  const autopilotRef = useRef(false);

  const [unlocked, setUnlocked] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(UNLOCK_KEY) === SECRET_PASSWORD;
  });
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phase, setPhase] = useState<Phase>('menu');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => getStoredBestScore());
  const [lives, setLives] = useState(3);
  const [stage, setStage] = useState(0);
  const [autopilot, setAutopilot] = useState(false);
  const [purcarAsset, setPurcarAsset] = useState(() => {
    const settings = loadStoredSettings();
    return resolvePurcarAvatar(settings.purcarAvatar, Date.now());
  });

  const purcarImage = useMemo(() => {
    const image = new Image();
    image.src = purcarAsset;
    return image;
  }, [purcarAsset]);
  const stripImages = useMemo(() => ({
    start: SECRET_START_ASSETS.map(src => {
      const image = new Image();
      image.src = src;
      return image;
    }),
    girls: SECRET_GIRL_ASSETS.map(group =>
      group.map(src => {
        const image = new Image();
        image.src = src;
        return image;
      }),
    ),
  }), []);

  const refreshPurcarAsset = useCallback(() => {
    const settings = loadStoredSettings();
    setPurcarAsset(resolvePurcarAvatar(settings.purcarAvatar, Date.now()));
  }, []);

  const syncHudState = useCallback(() => {
    setPhase(phaseRef.current);
    setScore(scoreRef.current);
    setBestScore(bestScoreRef.current);
    setLives(livesRef.current);
    setStage(stageRef.current);
  }, []);

  const resetToMenu = useCallback(() => {
    phaseRef.current = 'menu';
    scoreRef.current = 0;
    livesRef.current = 3;
    stageRef.current = 0;
    rodsRef.current = [];
    nextSpawnRef.current = 0;
    pauseMsRef.current = 0;
    crateXRef.current = TRACK_MIN_X + (TRACK_MAX_X - TRACK_MIN_X - CRATE_WIDTH) / 2;
    autopilotRef.current = false;
    setAutopilot(false);
    refreshPurcarAsset();
    syncHudState();
  }, [refreshPurcarAsset, syncHudState]);

  const startGame = useCallback((characterIndex: number, autoWin = false) => {
    selectedCharacterRef.current = characterIndex;
    phaseRef.current = 'play';
    scoreRef.current = 0;
    livesRef.current = 3;
    stageRef.current = 0;
    rodsRef.current = [];
    nextSpawnRef.current = 0;
    pauseMsRef.current = 0;
    crateXRef.current = TRACK_MIN_X + (TRACK_MAX_X - TRACK_MIN_X - CRATE_WIDTH) / 2;
    cursorRef.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    autopilotRef.current = autoWin;
    setAutopilot(autoWin);
    refreshPurcarAsset();
    syncHudState();
  }, [refreshPurcarAsset, syncHudState]);

  const finishGame = useCallback(() => {
    phaseRef.current = 'gameover';
    rodsRef.current = [];
    autopilotRef.current = false;
    setAutopilot(false);
    syncHudState();
  }, [syncHudState]);

  const finishWin = useCallback(() => {
    phaseRef.current = 'won';
    stageRef.current = 5;
    rodsRef.current = [];
    autopilotRef.current = false;
    setAutopilot(false);
    syncHudState();
  }, [syncHudState]);

  const startAutoWin = useCallback(() => {
    const characterIndex = selectedCharacterRef.current;
    if (phaseRef.current === 'play') {
      autopilotRef.current = true;
      setAutopilot(true);
      return;
    }

    startGame(characterIndex, true);
  }, [startGame]);

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim() !== SECRET_PASSWORD) {
      setPasswordError('Parola gresita.');
      return;
    }

    sessionStorage.setItem(UNLOCK_KEY, SECRET_PASSWORD);
    setUnlocked(true);
    setPasswordError('');
    setPassword('');
  };

  useEffect(() => {
    autopilotRef.current = autopilot;
  }, [autopilot]);

  useEffect(() => {
    if (!unlocked) return;
    resetToMenu();
  }, [resetToMenu, unlocked]);

  useEffect(() => {
    if (!unlocked) return;

    const onResize = () => {
      viewportRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width, height, dpr } = viewportRef.current;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked) return;

    const update = (dtMs: number) => {
      if (phaseRef.current !== 'play') return;

      if (pauseMsRef.current > 0) {
        pauseMsRef.current = Math.max(0, pauseMsRef.current - dtMs);
        return;
      }

      const rods = rodsRef.current;
      if (autopilotRef.current && rods.length > 0) {
        const target = rods.reduce((best, rod) => (rod.y > best.y ? rod : best), rods[0]);
        crateXRef.current = clamp(target.x - CRATE_WIDTH / 2, TRACK_MIN_X, TRACK_MAX_X - CRATE_WIDTH);
      } else {
        crateXRef.current = clamp(cursorRef.current.x - CRATE_WIDTH / 2, TRACK_MIN_X, TRACK_MAX_X - CRATE_WIDTH);
      }

      nextSpawnRef.current -= dtMs;
      while (nextSpawnRef.current < 0) {
        rods.push({
          x: random(TRACK_MIN_X + ROD_WIDTH, TRACK_MAX_X - ROD_WIDTH),
          y: -8,
          speed: random(2, 3),
          spin: Math.random() * Math.PI * 2,
        });

        const minDelay = autopilotRef.current ? 45 : Math.max(80, 100 - 20 * stageRef.current);
        const maxDelay = autopilotRef.current ? 150 : Math.max(160, 1500 - 250 * stageRef.current);
        nextSpawnRef.current += random(minDelay, maxDelay);
      }

      const nextRods: UraniumRod[] = [];
      let nextScore = scoreRef.current;
      let nextLives = livesRef.current;
      let caughtAny = false;

      rods.forEach(rod => {
        rod.y += dtMs * GAME_HEIGHT / 10000 * (rod.speed + stageRef.current);
        rod.spin += dtMs * 0.003;

        const autoCaught = autopilotRef.current && rod.y >= CRATE_Y - 4;
        if (autoCaught) {
          crateXRef.current = clamp(rod.x - CRATE_WIDTH / 2, TRACK_MIN_X, TRACK_MAX_X - CRATE_WIDTH);
        }

        const caught =
          autoCaught ||
          rod.x > crateXRef.current &&
          rod.x < crateXRef.current + CRATE_WIDTH &&
          rod.y > CRATE_Y &&
          rod.y < CRATE_Y + CRATE_HEIGHT / 2;

        if (caught) {
          nextScore += 100;
          caughtAny = true;
          return;
        }

        if (rod.y >= GAME_HEIGHT - 13) {
          nextLives -= 1;
          return;
        }

        nextRods.push(rod);
      });

      rodsRef.current = nextRods;

      if (caughtAny) {
        scoreRef.current = nextScore;
        if (nextScore > bestScoreRef.current) {
          bestScoreRef.current = nextScore;
          localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
        }

        const nextStage = getStageForScore(nextScore);
        if (nextStage > stageRef.current) {
          stageRef.current = nextStage;
          pauseMsRef.current = autopilotRef.current ? 500 : 6000;
        }

        if (scoreRef.current >= WIN_SCORE) {
          finishWin();
          return;
        }
      }

      if (nextLives !== livesRef.current) {
        livesRef.current = Math.max(0, nextLives);
      }

      if (livesRef.current < 1) {
        finishGame();
        return;
      }

      if (caughtAny || nextLives !== lives) syncHudState();
    };

    const draw = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height, dpr } = viewportRef.current;
      const topInset = 78;
      const bottomInset = 18;
      const availableHeight = Math.max(320, height - topInset - bottomInset);
      const scale = Math.min((width * 0.98) / GAME_WIDTH, availableHeight / GAME_HEIGHT);
      const offsetX = (width - GAME_WIDTH * scale) / 2;
      const offsetY = topInset + (availableHeight - GAME_HEIGHT * scale) / 2;
      layoutRef.current = { offsetX, offsetY, scale };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawPageBackdrop(ctx, width, height, time);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      if (phaseRef.current === 'menu') {
        drawMenu(ctx, purcarImage, stripImages.start, cursorRef.current.x, cursorRef.current.y, time, choicesRef);
      } else {
        drawGame(ctx, purcarImage, stripImages.girls, {
          time,
          rods: rodsRef.current,
          crateX: crateXRef.current,
          score: scoreRef.current,
          bestScore: bestScoreRef.current,
          lives: livesRef.current,
          stage: stageRef.current,
          pauseMs: pauseMsRef.current,
          phase: phaseRef.current,
          characterIndex: selectedCharacterRef.current,
          cursor: cursorRef.current,
        });
      }
      ctx.restore();
    };

    const loop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dtMs = Math.min(50, time - lastTimeRef.current);
      lastTimeRef.current = time;
      update(dtMs);
      draw(time);
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [finishGame, finishWin, lives, purcarImage, stripImages, syncHudState, unlocked]);

  const updateCursorFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { offsetX, offsetY, scale } = layoutRef.current;
    cursorRef.current = {
      x: clamp((clientX - rect.left - offsetX) / scale, 0, GAME_WIDTH),
      y: clamp((clientY - rect.top - offsetY) / scale, 0, GAME_HEIGHT),
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateCursorFromPointer(event.clientX, event.clientY);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateCursorFromPointer(event.clientX, event.clientY);
  };

  const handleCanvasClick = () => {
    const cursor = cursorRef.current;
    if (phaseRef.current === 'menu') {
      const choice = choicesRef.current.find(item => cursor.x >= item.x && cursor.x <= item.x + item.w && cursor.y >= item.y && cursor.y <= item.y + item.h);
      if (choice) startGame(choice.index);
      return;
    }

    if ((phaseRef.current === 'gameover' || phaseRef.current === 'won') && cursor.x >= 28 && cursor.x <= 96 && cursor.y >= 405 && cursor.y <= 466) {
      resetToMenu();
    }
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#08110c] text-white">
        <header className="site-header-sticky z-40 border-b border-white/10 bg-[#08110c]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:px-6">
            <Button variant="outline" onClick={() => navigate('/menu')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
              <ArrowLeft className="h-4 w-4" />
              Menu
            </Button>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
              <Lock className="h-5 w-5 text-[#b5ff53]" />
              Secret
            </div>
          </div>
        </header>

        <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(181,255,83,0.2),transparent_36%),linear-gradient(135deg,#08110c,#16361f_45%,#050706)]" />
          <div className="absolute inset-0 qual-flow-grid opacity-25" />

          <form onSubmit={handlePasswordSubmit} className="relative z-10 w-full max-w-sm rounded-lg border border-white/15 bg-black/45 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#b5ff53] text-[#11100f]">
              <Radiation className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-black">Secret access</h1>
            <p className="mt-2 text-sm leading-6 text-white/65">Parola trebuie introdusa inainte de joc.</p>

            <label htmlFor="secret-password" className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-white/60">
              Password
            </label>
            <Input
              id="secret-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-2 h-12 border-white/15 bg-white/10 text-white placeholder:text-white/30"
              autoComplete="off"
              autoFocus
            />
            {passwordError && <p className="mt-3 text-sm font-bold text-[#ff726f]">{passwordError}</p>}
            <Button type="submit" className="mt-5 h-12 w-full rounded-full bg-[#b5ff53] text-[#11100f] hover:bg-[#d5ff8f]">
              <ShieldCheck className="h-4 w-4" />
              Unlock
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair select-none touch-none"
      />

      <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-lg border border-white/15 bg-black/55 px-2 py-2 backdrop-blur-md sm:rounded-2xl sm:px-3">
          <Button variant="outline" onClick={() => navigate('/menu')} className="shrink-0 rounded-full px-3">
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Menu</span>
          </Button>

          <div className="min-w-0 text-center leading-tight">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b5ff53]/80">Uranium Strip</div>
            <div className="truncate text-sm font-black tabular-nums sm:text-xl">
              {score} / {bestScore} <span className="text-white/45">L{lives} S{stage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'play' && (
              <button
                type="button"
                onClick={() => setAutopilot(value => !value)}
                className={`hidden h-10 rounded-full border px-3 text-xs font-black uppercase tracking-[0.12em] sm:inline-flex ${
                  autopilot ? 'border-[#b5ff53] bg-[#b5ff53] text-[#11100f]' : 'border-white/20 bg-transparent text-white hover:bg-white/10'
                }`}
              >
                Auto
              </button>
            )}
            <button
              type="button"
              onClick={startAutoWin}
              className="hidden h-10 rounded-full border border-[#b5ff53]/70 bg-[#b5ff53] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#11100f] hover:bg-[#d5ff8f] sm:inline-flex"
            >
              Auto Win
            </button>
            <Button variant="outline" onClick={resetToMenu} className="shrink-0 rounded-full px-3">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {phase !== 'won' && (
        <button
          type="button"
          onClick={phase === 'play' ? () => setAutopilot(value => !value) : startAutoWin}
          className={`absolute bottom-4 left-1/2 z-20 h-11 -translate-x-1/2 rounded-full border px-5 text-xs font-black uppercase tracking-[0.14em] shadow-xl backdrop-blur-md sm:hidden ${
            autopilot ? 'border-[#b5ff53] bg-[#b5ff53] text-[#11100f]' : 'border-white/20 bg-black/55 text-white'
          }`}
        >
          {phase === 'play' ? 'Autopilot' : 'Auto Win'}
        </button>
      )}
    </main>
  );
};

function drawPageBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.22, 20, width * 0.5, height * 0.2, Math.max(width, height));
  gradient.addColorStop(0, '#203f18');
  gradient.addColorStop(0.45, '#07180f');
  gradient.addColorStop(1, '#020403');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(181,255,83,0.08)';
  ctx.lineWidth = 1;
  const shift = (time * 0.018) % 46;
  for (let x = -46; x < width + 46; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x + shift, 0);
    ctx.lineTo(x - height + shift, height);
    ctx.stroke();
  }
}

function drawMenu(
  ctx: CanvasRenderingContext2D,
  purcarImage: HTMLImageElement,
  startImages: HTMLImageElement[],
  cursorX: number,
  cursorY: number,
  time: number,
  choicesRef: React.MutableRefObject<Choice[]>,
) {
  const gradient = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 135, GAME_WIDTH / 2, GAME_HEIGHT / 2, 242);
  gradient.addColorStop(0, '#5c8b12');
  gradient.addColorStop(1, '#012c17');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < GAME_HEIGHT; y += 20) {
    ctx.fillRect(0, y, GAME_WIDTH, 1);
  }

  const choices: Choice[] = [
    { index: 0, x: 116, y: 95, w: 124, h: 245 },
    { index: 1, x: 276, y: 95, w: 124, h: 245 },
    { index: 2, x: 436, y: 95, w: 124, h: 245 },
  ];
  choicesRef.current = choices;

  choices.forEach(choice => {
    const hovered = cursorX >= choice.x && cursorX <= choice.x + choice.w && cursorY >= choice.y && cursorY <= choice.y + choice.h;
    const lift = hovered ? 6 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(choice.x - 5, choice.y - 4, choice.w + 3, choice.h);
    drawCharacter(ctx, purcarImage, startImages[choice.index], choice.x + lift, choice.y + lift, choice.w, choice.h, 0, choice.index, true);
  });

  ctx.fillStyle = '#aa9d69';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE PURCAR!', GAME_WIDTH / 2, 67);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, GAME_HEIGHT - 67, GAME_WIDTH, 67);
  ctx.font = 'bold italic 30px Arial';
  ctx.fillText('Uranium me!!!', GAME_WIDTH / 2 - 9, 387);

  const pulse = 1 + Math.abs(Math.sin(time * 0.004)) * 3;
  ctx.fillStyle = '#ff1010';
  ctx.fillText('Uranium me!!!', GAME_WIDTH / 2 - 9 + pulse, 387 - pulse);

  drawStartBottle(ctx, 560, 367, time);
  drawMenuFrame(ctx);
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  purcarImage: HTMLImageElement,
  girlImages: HTMLImageElement[][],
  state: {
    time: number;
    rods: UraniumRod[];
    crateX: number;
    score: number;
    bestScore: number;
    lives: number;
    stage: number;
    pauseMs: number;
    phase: Phase;
    characterIndex: number;
    cursor: { x: number; y: number };
  },
) {
  drawGameBackground(ctx, state.time);

  if (state.phase === 'play') {
    state.rods.forEach(rod => drawUraniumRod(ctx, rod.x, rod.y, rod.spin));
    drawCrate(ctx, state.crateX, CRATE_Y);
  }

  const girlImage = girlImages[state.characterIndex]?.[state.stage] ?? girlImages[0]?.[state.stage];
  drawCharacter(ctx, purcarImage, girlImage, 496, 17, 158, GAME_HEIGHT - 27, state.stage, state.characterIndex, false);
  drawGameFrame(ctx);
  drawVial(ctx, state.score);
  drawScore(ctx, state.score, state.bestScore, state.phase);
  drawLives(ctx, state.lives);

  if (state.pauseMs > 0 && state.phase === 'play') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(96, 130, 395, 105);
    ctx.strokeStyle = '#b5ff53';
    ctx.lineWidth = 2;
    ctx.strokeRect(101, 135, 385, 95);
    ctx.fillStyle = '#b5ff53';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('REACTOR LEVEL UP', 292, 174);
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`STAGE ${state.stage}`, 292, 205);
  }

  if (state.phase === 'gameover') {
    drawGameOver(ctx, state.time);
  }

  if (state.phase === 'won') {
    drawWin(ctx, state.time);
  }
}

function drawGameBackground(ctx: CanvasRenderingContext2D, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
  gradient.addColorStop(0, '#093b27');
  gradient.addColorStop(0.45, '#134f26');
  gradient.addColorStop(1, '#052514');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let y = 0; y < GAME_HEIGHT; y += 26) ctx.fillRect(0, y, GAME_WIDTH, 1);

  ctx.fillStyle = 'rgba(181,255,83,0.1)';
  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 83 + time * 0.025) % 560) + 38;
    const y = 54 + ((i * 47) % 350);
    drawRadiationSymbol(ctx, x, y, 10 + (i % 3) * 3, 'rgba(181,255,83,0.11)');
  }

  ctx.fillStyle = '#092013';
  ctx.fillRect(82, 58, 425, 360);
  ctx.strokeStyle = 'rgba(181,255,83,0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(90, 64, 409, 346);
}

function drawMenuFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#10180e';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, GAME_WIDTH - 18, GAME_HEIGHT - 18);
  ctx.strokeStyle = '#aa9d69';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, GAME_WIDTH - 44, GAME_HEIGHT - 44);
}

function drawGameFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#06190e';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, GAME_WIDTH - 18, GAME_HEIGHT - 18);
  ctx.strokeStyle = '#aa9d69';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, GAME_WIDTH - 44, GAME_HEIGHT - 44);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(24, GAME_HEIGHT - 82, 468, 58);
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  purcarImage: HTMLImageElement,
  bodyImage: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  stage: number,
  variant: number,
  compact: boolean,
) {
  if (bodyImage?.complete && bodyImage.naturalWidth > 0) {
    ctx.drawImage(bodyImage, x, y, w, h);
    drawPurcarHeadOverlay(ctx, purcarImage, x, y, w, h, compact);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  const glow = stage / 5;
  const suitColors = [
    ['#3f5b7e', '#90b9d8'],
    ['#6b446e', '#d2a1e6'],
    ['#6a5a2f', '#e8cc68'],
  ][variant % 3];

  const bodyX = w * 0.23;
  const bodyY = h * 0.31;
  const bodyW = w * 0.54;
  const bodyH = h * 0.45;

  ctx.shadowColor = `rgba(181,255,83,${0.12 + glow * 0.45})`;
  ctx.shadowBlur = 12 + stage * 5;
  ctx.fillStyle = '#101412';
  roundRect(ctx, bodyX - 12, bodyY + 22, bodyW + 24, bodyH + 80, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = suitColors[0];
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 18);
  ctx.fill();

  ctx.fillStyle = suitColors[1];
  roundRect(ctx, bodyX + 8, bodyY + 8, bodyW - 16, bodyH - 12, 13);
  ctx.fill();

  ctx.fillStyle = `rgba(181,255,83,${0.18 + glow * 0.3})`;
  roundRect(ctx, bodyX + 18, bodyY + 25, bodyW - 36, 16 + stage * 3, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(bodyX + 4, bodyY + 34);
  ctx.lineTo(bodyX - 14, bodyY + bodyH * 0.72);
  ctx.moveTo(bodyX + bodyW - 4, bodyY + 34);
  ctx.lineTo(bodyX + bodyW + 14, bodyY + bodyH * 0.72);
  ctx.stroke();

  ctx.fillStyle = '#1e261f';
  roundRect(ctx, bodyX + 5, bodyY + bodyH - 2, bodyW * 0.38, h * 0.19, 10);
  ctx.fill();
  roundRect(ctx, bodyX + bodyW * 0.57, bodyY + bodyH - 2, bodyW * 0.38, h * 0.19, 10);
  ctx.fill();

  ctx.fillStyle = '#0b0d0b';
  roundRect(ctx, bodyX - 1, bodyY + bodyH + h * 0.14, bodyW * 0.43, 12, 4);
  ctx.fill();
  roundRect(ctx, bodyX + bodyW * 0.56, bodyY + bodyH + h * 0.14, bodyW * 0.43, 12, 4);
  ctx.fill();

  const headSize = compact ? 58 : 76;
  const headX = w / 2 - headSize / 2;
  const headY = compact ? 18 : 20;
  ctx.save();
  roundRect(ctx, headX, headY, headSize, headSize, 14);
  ctx.clip();
  if (purcarImage.complete && purcarImage.naturalWidth > 0) {
    ctx.drawImage(purcarImage, headX, headY, headSize, headSize);
  } else {
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(headX, headY, headSize, headSize);
  }
  ctx.restore();
  ctx.strokeStyle = '#b5ff53';
  ctx.lineWidth = 3;
  roundRect(ctx, headX, headY, headSize, headSize, 14);
  ctx.stroke();

  ctx.fillStyle = '#b5ff53';
  ctx.font = compact ? 'bold 12px Arial' : 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`U-${stage + 1}`, w / 2, bodyY + bodyH * 0.58);

  if (!compact) {
    drawRadiationSymbol(ctx, w / 2, bodyY + bodyH * 0.75, 13 + stage, '#101412');
  }

  ctx.restore();
}

function drawPurcarHeadOverlay(
  ctx: CanvasRenderingContext2D,
  purcarImage: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean,
) {
  const size = compact ? w * 0.44 : w * 0.38;
  const headX = x + w * 0.5 - size / 2;
  const headY = y + (compact ? h * 0.005 : h * 0.015);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = compact ? 8 : 10;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, headX, headY, size, size, compact ? 11 : 13);
  ctx.clip();
  if (purcarImage.complete && purcarImage.naturalWidth > 0) {
    ctx.drawImage(purcarImage, headX, headY, size, size);
  } else {
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(headX, headY, size, size);
  }
  ctx.restore();

  ctx.strokeStyle = '#b5ff53';
  ctx.lineWidth = compact ? 2.5 : 3;
  roundRect(ctx, headX, headY, size, size, compact ? 11 : 13);
  ctx.stroke();
}

function drawStartBottle(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.003) * 3);
  drawUraniumRod(ctx, 28, 78, -0.2);
  ctx.restore();
}

function drawUraniumRod(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin) * 0.18);

  const gradient = ctx.createLinearGradient(-ROD_WIDTH / 2, -ROD_HEIGHT, ROD_WIDTH / 2, 0);
  gradient.addColorStop(0, '#e4ff88');
  gradient.addColorStop(0.45, '#64f12b');
  gradient.addColorStop(1, '#169536');
  ctx.fillStyle = gradient;
  roundRect(ctx, -ROD_WIDTH / 2, -ROD_HEIGHT, ROD_WIDTH, ROD_HEIGHT, 8);
  ctx.fill();

  ctx.strokeStyle = '#08110c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-ROD_WIDTH / 2 + 5, -ROD_HEIGHT + 7, 4, ROD_HEIGHT - 14);
  drawRadiationSymbol(ctx, 0, -ROD_HEIGHT * 0.48, 8, '#07110b');
  ctx.restore();
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#202a28';
  roundRect(ctx, 0, 16, CRATE_WIDTH, CRATE_HEIGHT - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#6f7b76';
  roundRect(ctx, 6, 10, CRATE_WIDTH - 12, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#b5ff53';
  for (let i = 0; i < 6; i += 1) {
    ctx.save();
    ctx.translate(12 + i * 17, 39);
    ctx.rotate(-0.55);
    ctx.fillRect(0, 0, 9, 28);
    ctx.restore();
  }
  ctx.fillStyle = '#101412';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('URANIUM', CRATE_WIDTH / 2, 61);
  ctx.restore();
}

function drawVial(ctx: CanvasRenderingContext2D, score: number) {
  const x = 45;
  const y = 43;
  const w = 44;
  const h = 153;
  const fill = clamp(score / 10000, 0, 1);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#dbeee4';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();

  const fillHeight = (h - 12) * fill;
  const gradient = ctx.createLinearGradient(x, y + h - fillHeight, x, y + h);
  gradient.addColorStop(0, '#d9ff68');
  gradient.addColorStop(1, '#2fc94e');
  ctx.fillStyle = gradient;
  roundRect(ctx, x + 6, y + h - 6 - fillHeight, w - 12, fillHeight, 11);
  ctx.fill();

  ctx.fillStyle = 'rgba(181,255,83,0.45)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 8 - fillHeight, w * 0.32, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, bestScore: number, phase: Phase) {
  ctx.font = 'bold italic 28px Arial';
  ctx.fillStyle = '#ff2020';
  ctx.textAlign = phase !== 'play' ? 'center' : 'right';
  ctx.fillText(score.toString(), phase !== 'play' ? 252 : 470, phase !== 'play' ? 273 : 40);

  if (phase !== 'gameover') {
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#aa9d69';
    ctx.fillText(`BEST ${bestScore}`, 470, 58);
  }
}

function drawLives(ctx: CanvasRenderingContext2D, lives: number) {
  for (let i = 0; i < lives; i += 1) {
    drawRadiationSymbol(ctx, 37 + i * 26, GAME_HEIGHT - 52, 10, '#b5ff53');
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(94, 130, 399, 183);
  ctx.font = 'bold 42px Arial';
  ctx.fillStyle = `rgba(181,255,83,${0.56 + Math.abs(Math.sin(time * 0.006)) * 0.44})`;
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', 255, 230);
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ff2020';
  ctx.fillText('new', 58, GAME_HEIGHT - 52);
  ctx.fillText('game', 58, GAME_HEIGHT - 34);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#003300';
  ctx.fillText('purcar.xyz/secret', 252, GAME_HEIGHT - 36);
}

function drawWin(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(84, 120, 418, 205);
  ctx.strokeStyle = '#b5ff53';
  ctx.lineWidth = 3;
  ctx.strokeRect(92, 128, 402, 189);
  ctx.font = 'bold 44px Arial';
  ctx.fillStyle = `rgba(181,255,83,${0.68 + Math.abs(Math.sin(time * 0.006)) * 0.32})`;
  ctx.textAlign = 'center';
  ctx.fillText('YOU WIN', 292, 213);
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#aa9d69';
  ctx.fillText('reactor full', 292, 242);
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ff2020';
  ctx.fillText('new', 58, GAME_HEIGHT - 52);
  ctx.fillText('game', 58, GAME_HEIGHT - 34);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#003300';
  ctx.fillText('purcar.xyz/secret', 252, GAME_HEIGHT - 36);
}

function drawRadiationSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 3 - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.25);
    ctx.arc(0, 0, size, -0.42, 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
