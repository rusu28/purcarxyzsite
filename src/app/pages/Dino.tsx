import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDown, ArrowLeft, ArrowUp, BatteryCharging, Gauge, RefreshCcw, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type Phase = 'ready' | 'running' | 'crashed';
type ObstacleKind = 'cactus' | 'rock' | 'bird' | 'double' | 'drone';
type PickupKind = 'coin' | 'shield' | 'cell';

type Viewport = {
  screenWidth: number;
  screenHeight: number;
  width: number;
  height: number;
  dpr: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

type Runner = {
  y: number;
  vy: number;
  crouching: boolean;
  jumpHeld: boolean;
  jumpsLeft: number;
  coyote: number;
  jumpBuffer: number;
  slide: number;
  slideCooldown: number;
  slam: boolean;
  shield: number;
};

type Obstacle = {
  kind: ObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
  phase: number;
};

type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  radius: number;
  phase: number;
  collected: boolean;
};

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type Star = {
  x: number;
  y: number;
  speed: number;
  alpha: number;
};

type World = ReturnType<typeof getWorldMetrics>;

const BEST_KEY = 'dino-best-score';
const FRAME_RATE_KEY = 'purcar-arcade-fps';
const FRAME_RATE_OPTIONS = [60, 90, 120, 144, 165, 240] as const;
type FrameRate = typeof FRAME_RATE_OPTIONS[number];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const readStoredFrameRate = (): FrameRate => {
  if (typeof window === 'undefined') return 144;
  const stored = Number(localStorage.getItem(FRAME_RATE_KEY));
  return FRAME_RATE_OPTIONS.includes(stored as FrameRate) ? (stored as FrameRate) : 144;
};

const getViewport = (): Viewport => {
  const screenWidth = typeof window === 'undefined' ? 1280 : Math.max(320, window.innerWidth);
  const screenHeight = typeof window === 'undefined' ? 720 : Math.max(420, window.innerHeight);
  const portrait = screenHeight > screenWidth;
  const width = portrait ? 720 : 1280;
  const height = portrait ? 1280 : 720;
  const scale = Math.max(screenWidth / width, screenHeight / height);
  const offsetX = (screenWidth - width * scale) / 2;
  const offsetY = screenHeight - height * scale;

  return {
    screenWidth,
    screenHeight,
    width,
    height,
    dpr: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    scale,
    offsetX,
    offsetY,
  };
};

const getWorldMetrics = (viewport: Viewport, score: number) => {
  const { width, height } = viewport;
  const shortSide = Math.min(width, height);
  const progress = clamp(score / 900, 0, 1);
  const groundHeight = clamp(height * 0.17, 82, 170);
  const groundY = height - groundHeight;
  const playerSize = clamp(shortSide * 0.092, 48, 92);
  const playerX = clamp(width * 0.15, 74, 250);
  const gravity = clamp(height * (2.82 + progress * 0.55), 1440, 3150);
  const jump = -clamp(height * (0.98 + progress * 0.08), 610, 1050);
  const jumpCut = 0.44;
  const speed = clamp(width * (0.34 + progress * 0.2), 260, 780);
  const spawnBase = clamp(1.18 - progress * 0.34, 0.68, 1.18);
  return { width, height, groundHeight, groundY, playerSize, playerX, gravity, jump, jumpCut, speed, spawnBase, progress };
};

const makeImages = () => {
  const paths = [
    '/assets/snake/head.png',
    '/assets/snake/purcar2.jpeg',
    '/assets/snake/purcar3.jpeg',
    '/assets/snake/purcar4.jpeg',
    '/assets/snake/purcar5.jpeg',
    '/assets/snake/purcar6.jpeg',
  ];

  return paths.map(path => {
    const image = new Image();
    image.src = path;
    return image;
  });
};

const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const circleRectOverlap = (x: number, y: number, r: number, rect: { x: number; y: number; w: number; h: number }) => {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
};

const drawRadiationSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = '#facc15') => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.rotate(i * (Math.PI * 2 / 3) - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.24);
    ctx.arc(0, 0, radius * 0.82, -Math.PI * 0.34, Math.PI * 0.34);
    ctx.lineTo(0, -radius * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

export const Dino: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const viewportRef = useRef<Viewport>(getViewport());
  const frameRateRef = useRef<FrameRate>(readStoredFrameRate());

  const phaseRef = useRef<Phase>('ready');
  const runnerRef = useRef<Runner>({
    y: 0,
    vy: 0,
    crouching: false,
    jumpHeld: false,
    jumpsLeft: 1,
    coyote: 0,
    jumpBuffer: 0,
    slide: 0,
    slideCooldown: 0,
    slam: false,
    shield: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const dustRef = useRef<Dust[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const bestRef = useRef(Number(localStorage.getItem(BEST_KEY) ?? '0'));
  const energyRef = useRef(0);
  const spawnRef = useRef(0);
  const nextSpawnRef = useRef(1);
  const worldOffsetRef = useRef(0);
  const shakeRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(bestRef.current);
  const [shield, setShield] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [frameRate, setFrameRate] = useState<FrameRate>(frameRateRef.current);
  const [speedLabel, setSpeedLabel] = useState('1.0x');
  const [avatarSrc, setAvatarSrc] = useState(() => resolvePurcarAvatar(loadStoredSettings().purcarAvatar, Date.now()));

  const avatars = useMemo(makeImages, []);
  const activeAvatar = useCallback(() => {
    const file = avatarSrc.split('/').pop();
    return avatars.find(image => image.src.includes(file ?? '')) ?? avatars[0];
  }, [avatars, avatarSrc]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    viewportRef.current = getViewport();
    const { screenWidth, screenHeight, dpr } = viewportRef.current;
    canvas.width = Math.floor(screenWidth * dpr);
    canvas.height = Math.floor(screenHeight * dpr);
    canvas.style.width = `${screenWidth}px`;
    canvas.style.height = `${screenHeight}px`;

    if (phaseRef.current !== 'running') {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current);
      runnerRef.current.y = world.groundY - world.playerSize;
    }
  }, []);

  const updateFrameRate = useCallback((nextFrameRate: FrameRate) => {
    frameRateRef.current = nextFrameRate;
    setFrameRate(nextFrameRate);
    localStorage.setItem(FRAME_RATE_KEY, String(nextFrameRate));
    lastTimeRef.current = null;
  }, []);

  const buildStars = useCallback(() => {
    const { width, height } = viewportRef.current;
    starsRef.current = Array.from({ length: 44 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.65,
      speed: 8 + Math.random() * 28,
      alpha: 0.18 + Math.random() * 0.52,
    }));
  }, []);

  const addDust = useCallback((x: number, y: number, count: number, color = '#d8b98b') => {
    for (let i = 0; i < count; i += 1) {
      dustRef.current.push({
        x,
        y,
        vx: -70 - Math.random() * 220,
        vy: -40 - Math.random() * 110,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
        size: 2 + Math.random() * 5,
        color,
      });
    }
  }, []);

  const reset = useCallback((nextPhase: Phase = 'ready') => {
    const world = getWorldMetrics(viewportRef.current, 0);
    phaseRef.current = nextPhase;
    runnerRef.current = {
      y: world.groundY - world.playerSize,
      vy: 0,
      crouching: false,
      jumpHeld: false,
      jumpsLeft: 1,
      coyote: 0,
      jumpBuffer: 0,
      slide: 0,
      slideCooldown: 0,
      slam: false,
      shield: 0,
    };
    obstaclesRef.current = [];
    pickupsRef.current = [];
    dustRef.current = [];
    scoreRef.current = 0;
    energyRef.current = 0;
    spawnRef.current = 0;
    nextSpawnRef.current = 0.92;
    worldOffsetRef.current = 0;
    shakeRef.current = 0;
    buildStars();
    setPhase(nextPhase);
    setScore(0);
    setShield(0);
    setEnergy(0);
    setSpeedLabel('1.0x');
    setAvatarSrc(resolvePurcarAvatar(loadStoredSettings().purcarAvatar, Date.now()));
  }, [buildStars]);

  const startRun = useCallback(() => {
    if (phaseRef.current === 'crashed') {
      reset('ready');
      return;
    }
    if (phaseRef.current === 'ready') {
      phaseRef.current = 'running';
      setPhase('running');
    }
  }, [reset]);

  const requestJump = useCallback(() => {
    startRun();
    const runner = runnerRef.current;
    runner.jumpHeld = true;
    runner.jumpBuffer = 0.14;
  }, [startRun]);

  const releaseJump = useCallback(() => {
    const runner = runnerRef.current;
    runner.jumpHeld = false;
    const world = getWorldMetrics(viewportRef.current, scoreRef.current);
    if (runner.vy < 0) runner.vy *= world.jumpCut;
  }, []);

  const setCrouch = useCallback((enabled: boolean) => {
    startRun();
    const runner = runnerRef.current;
    const world = getWorldMetrics(viewportRef.current, scoreRef.current);
    const playerHeight = world.playerSize * (runner.slide > 0 ? 0.48 : runner.crouching ? 0.62 : 1);
    const grounded = runner.y >= world.groundY - playerHeight - 2;
    runner.crouching = enabled;
    if (!enabled) return;

    if (!grounded) {
      runner.slam = true;
      runner.vy = Math.max(runner.vy, world.height * 1.28);
      addDust(world.playerX + world.playerSize * 0.52, runner.y + world.playerSize * 0.92, 7, '#facc15');
      return;
    }

    if (runner.slideCooldown <= 0) {
      runner.slide = clamp(0.46 + energyRef.current * 0.006, 0.46, 0.72);
      runner.slideCooldown = 0.64;
      if (energyRef.current > 0) {
        energyRef.current = Math.max(0, energyRef.current - 4);
        setEnergy(Math.round(energyRef.current));
      }
      addDust(world.playerX + world.playerSize * 0.9, world.groundY - 8, 14, '#facc15');
    } else {
      addDust(world.playerX, runner.y + 42, 4, '#caa26a');
    }
  }, [addDust, startRun]);

  const spawnObstacle = useCallback((world: World) => {
    const difficulty = world.progress;
    const roll = Math.random();
    let kind: ObstacleKind = 'cactus';
    if (scoreRef.current > 160 && roll > 0.72) kind = 'bird';
    if (scoreRef.current > 230 && roll > 0.62 && roll < 0.78) kind = 'drone';
    if (scoreRef.current > 280 && roll > 0.88) kind = 'double';
    if (roll < 0.24) kind = 'rock';

    const baseX = world.width + 36;
    if (kind === 'drone') {
      const height = clamp(world.playerSize * 0.22, 18, 28);
      const width = clamp(world.playerSize * 1.05, 64, 108);
      const y = world.groundY - world.playerSize * 0.82;
      obstaclesRef.current.push({ kind, x: baseX, y, width, height, phase: Math.random() * Math.PI * 2 });
      return;
    }

    if (kind === 'bird') {
      const height = clamp(world.playerSize * (0.36 + Math.random() * 0.18), 28, 48);
      const width = height * 1.55;
      const y = world.groundY - world.playerSize * (1.45 + Math.random() * 0.42);
      obstaclesRef.current.push({ kind, x: baseX, y, width, height, phase: Math.random() * Math.PI * 2 });
      return;
    }

    if (kind === 'double') {
      const height = clamp(world.playerSize * (0.56 + difficulty * 0.28), 36, 82);
      const width = clamp(world.playerSize * 0.32, 24, 44);
      obstaclesRef.current.push({ kind: 'cactus', x: baseX, y: world.groundY - height, width, height, phase: 0 });
      obstaclesRef.current.push({ kind: 'cactus', x: baseX + width + clamp(world.playerSize * 0.38, 26, 44), y: world.groundY - height * 0.86, width, height: height * 0.86, phase: 0 });
      return;
    }

    const height = kind === 'rock'
      ? clamp(world.playerSize * (0.34 + Math.random() * 0.12), 26, 48)
      : clamp(world.playerSize * (0.58 + Math.random() * (0.36 + difficulty * 0.18)), 40, 96);
    const width = kind === 'rock'
      ? clamp(world.playerSize * (0.55 + Math.random() * 0.2), 34, 70)
      : clamp(world.playerSize * (0.34 + Math.random() * 0.18), 24, 48);
    obstaclesRef.current.push({ kind, x: baseX, y: world.groundY - height, width, height, phase: 0 });

    if (Math.random() < 0.34) {
      pickupsRef.current.push({
        kind: Math.random() < 0.12 ? 'shield' : Math.random() < 0.5 ? 'cell' : 'coin',
        x: baseX + world.width * 0.18,
        y: world.groundY - world.playerSize * (1.05 + Math.random() * 0.65),
        radius: clamp(world.playerSize * 0.16, 10, 16),
        phase: Math.random() * Math.PI * 2,
        collected: false,
      });
    }
  }, []);

  const crash = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const runner = runnerRef.current;
    if (runner.shield > 0) {
      runner.shield = 0;
      setShield(0);
      shakeRef.current = 0.35;
      addDust(getWorldMetrics(viewportRef.current, scoreRef.current).playerX, runner.y + 36, 16, '#93c5fd');
      obstaclesRef.current = obstaclesRef.current.filter(obstacle => obstacle.x < getWorldMetrics(viewportRef.current, scoreRef.current).playerX - 40);
      return;
    }
    phaseRef.current = 'crashed';
    setPhase('crashed');
    shakeRef.current = 0.55;
    addDust(getWorldMetrics(viewportRef.current, scoreRef.current).playerX, runner.y + 36, 24, '#fb7185');
  }, [addDust]);

  useEffect(() => {
    resizeCanvas();
    reset('ready');
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [reset, resizeCanvas]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        requestJump();
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        setCrouch(true);
      }
      if (event.code === 'KeyR') {
        event.preventDefault();
        reset('ready');
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        releaseJump();
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        setCrouch(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [releaseJump, requestJump, reset, setCrouch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const updateRunner = (world: World, dt: number) => {
      const runner = runnerRef.current;
      runner.slide = Math.max(0, runner.slide - dt);
      runner.slideCooldown = Math.max(0, runner.slideCooldown - dt);

      const sliding = runner.slide > 0;
      const playerHeight = world.playerSize * (sliding ? 0.48 : runner.crouching ? 0.62 : 1);
      const groundPlayerY = world.groundY - playerHeight;
      const grounded = runner.y >= groundPlayerY - 0.5;

      runner.coyote = grounded ? 0.095 : Math.max(0, runner.coyote - dt);
      runner.jumpBuffer = Math.max(0, runner.jumpBuffer - dt);

      if (runner.jumpBuffer > 0 && (grounded || runner.coyote > 0 || runner.jumpsLeft > 0)) {
        runner.jumpBuffer = 0;
        runner.coyote = 0;
        runner.crouching = false;
        runner.slide = 0;
        runner.slam = false;
        runner.vy = world.jump;
        runner.jumpsLeft = grounded ? 1 : Math.max(0, runner.jumpsLeft - 1);
        addDust(world.playerX + world.playerSize * 0.45, world.groundY - 8, 10, '#e8d8b4');
      }

      const gravity = runner.vy < 0 && runner.jumpHeld ? world.gravity * 0.76 : world.gravity;
      runner.vy += gravity * dt;
      runner.vy = clamp(runner.vy, world.jump * 1.1, world.height * 1.35);
      runner.y += runner.vy * dt;

      if (runner.y >= groundPlayerY) {
        if (!grounded && runner.vy > world.height * 0.35) addDust(world.playerX + world.playerSize * 0.5, world.groundY - 6, runner.slam ? 26 : 12, runner.slam ? '#facc15' : '#d2b48c');
        runner.y = groundPlayerY;
        runner.vy = 0;
        runner.jumpsLeft = 1;

        if (runner.slam) {
          const clearRange = world.playerSize * 2.35;
          const before = obstaclesRef.current.length;
          obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
            const center = obstacle.x + obstacle.width / 2;
            const groundedObstacle = obstacle.y + obstacle.height > world.groundY - world.playerSize * 1.18;
            return !(groundedObstacle && Math.abs(center - (world.playerX + world.playerSize * 0.5)) < clearRange);
          });
          const cleared = before - obstaclesRef.current.length;
          if (cleared > 0) {
            scoreRef.current += cleared * 45;
            energyRef.current = clamp(energyRef.current + cleared * 14, 0, 100);
            setScore(Math.floor(scoreRef.current));
            setEnergy(Math.round(energyRef.current));
            shakeRef.current = 0.22;
          }
          runner.slam = false;
        }
      }

      runner.shield = Math.max(0, runner.shield - dt);
      setShield(Math.ceil(runner.shield));
    };

    const update = (dt: number) => {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current);
      starsRef.current.forEach(star => {
        star.x -= star.speed * dt;
        if (star.x < 0) {
          star.x = world.width;
          star.y = Math.random() * world.height * 0.65;
        }
      });

      dustRef.current = dustRef.current
        .map(dust => ({
          ...dust,
          x: dust.x + dust.vx * dt,
          y: dust.y + dust.vy * dt,
          vy: dust.vy + 440 * dt,
          life: dust.life - dt,
        }))
        .filter(dust => dust.life > 0);

      if (phaseRef.current !== 'running') return;

      scoreRef.current += dt * (42 + world.progress * 58);
      const nextScore = Math.floor(scoreRef.current);
      setScore(nextScore);
      if (nextScore > bestRef.current) {
        bestRef.current = nextScore;
        setBestScore(nextScore);
        localStorage.setItem(BEST_KEY, String(nextScore));
      }
      setSpeedLabel(`${(1 + world.progress * 1.45).toFixed(1)}x`);

      const runSpeed = world.speed * (runnerRef.current.slide > 0 ? 1.28 : 1);
      worldOffsetRef.current += runSpeed * dt;
      spawnRef.current += dt;
      if (spawnRef.current >= nextSpawnRef.current) {
        spawnRef.current = 0;
        nextSpawnRef.current = clamp(world.spawnBase + (Math.random() - 0.5) * 0.28, 0.52, 1.26);
        const last = obstaclesRef.current[obstaclesRef.current.length - 1];
        const minGap = runSpeed * clamp(0.68 - world.progress * 0.12, 0.5, 0.68);
        if (!last || world.width - (last.x + last.width) > minGap) spawnObstacle(world);
        else nextSpawnRef.current = 0.18;
      }

      updateRunner(world, dt);

      obstaclesRef.current.forEach(obstacle => {
        obstacle.x -= runSpeed * dt;
        obstacle.phase += dt * 5.2;
        if (obstacle.kind === 'bird') obstacle.y += Math.sin(obstacle.phase) * dt * 28;
        if (obstacle.kind === 'drone') obstacle.y += Math.sin(obstacle.phase) * dt * 18;
      });
      obstaclesRef.current = obstaclesRef.current.filter(obstacle => obstacle.x + obstacle.width > -40);

      pickupsRef.current.forEach(pickup => {
        pickup.x -= runSpeed * dt;
        pickup.phase += dt * 4;
      });

      const runner = runnerRef.current;
      const crouch = runner.crouching;
      const sliding = runner.slide > 0;
      const body = {
        x: world.playerX + world.playerSize * 0.12,
        y: runner.y + world.playerSize * (sliding ? 0.34 : crouch ? 0.24 : 0.1),
        w: world.playerSize * (sliding ? 0.9 : 0.72),
        h: world.playerSize * (sliding ? 0.3 : crouch ? 0.42 : 0.78),
      };

      pickupsRef.current.forEach(pickup => {
        if (pickup.collected) return;
        const pickupY = pickup.y + Math.sin(pickup.phase) * 8;
        if (circleRectOverlap(pickup.x, pickupY, pickup.radius, body)) {
          pickup.collected = true;
          if (pickup.kind === 'shield') {
            runner.shield = 7;
            setShield(7);
            addDust(pickup.x, pickupY, 18, '#93c5fd');
          } else {
            scoreRef.current += 35;
            energyRef.current = clamp(energyRef.current + (pickup.kind === 'cell' ? 24 : 8), 0, 100);
            setScore(Math.floor(scoreRef.current));
            setEnergy(Math.round(energyRef.current));
            addDust(pickup.x, pickupY, 14, pickup.kind === 'cell' ? '#7dd3fc' : '#facc15');
          }
        }
      });
      pickupsRef.current = pickupsRef.current.filter(pickup => pickup.x > -40 && !pickup.collected);

      const hit = obstaclesRef.current.some(obstacle => rectsOverlap(body, { x: obstacle.x, y: obstacle.y, w: obstacle.width, h: obstacle.height }));
      if (hit) crash();
      shakeRef.current = Math.max(0, shakeRef.current - dt);
    };

    const drawBackground = (world: World) => {
      const { dpr, offsetX, offsetY, scale, screenHeight, screenWidth } = viewportRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, screenWidth, screenHeight);
      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offsetX * dpr, offsetY * dpr);

      const shake = shakeRef.current > 0 ? Math.sin(performance.now() * 0.08) * shakeRef.current * 14 : 0;
      ctx.translate(shake, 0);

      const sky = ctx.createLinearGradient(0, 0, 0, world.height);
      sky.addColorStop(0, '#070b14');
      sky.addColorStop(0.5, '#1a2636');
      sky.addColorStop(1, '#4a3219');
      ctx.fillStyle = sky;
      ctx.fillRect(-30, 0, world.width + 60, world.height);

      const reactorGlow = ctx.createRadialGradient(world.width * 0.68, world.height * 0.4, 20, world.width * 0.68, world.height * 0.4, world.width * 0.58);
      reactorGlow.addColorStop(0, 'rgba(250, 204, 21, 0.2)');
      reactorGlow.addColorStop(0.36, 'rgba(125, 211, 252, 0.1)');
      reactorGlow.addColorStop(1, 'rgba(7, 11, 20, 0)');
      ctx.fillStyle = reactorGlow;
      ctx.fillRect(0, 0, world.width, world.height);

      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      const grid = 76;
      const offset = worldOffsetRef.current * 0.08 % grid;
      for (let x = -grid; x < world.width + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x - offset, 0);
        ctx.lineTo(x - offset + world.height * 0.24, world.height);
        ctx.stroke();
      }
      for (let y = 0; y < world.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset * 0.4);
        ctx.lineTo(world.width, y + offset * 0.4);
        ctx.stroke();
      }
      ctx.restore();

      starsRef.current.forEach(star => {
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, 2, 2);
      });
      ctx.globalAlpha = 1;

      const farOffset = worldOffsetRef.current * 0.08;
      ctx.fillStyle = 'rgba(11, 18, 32, 0.74)';
      for (let i = -1; i < 8; i += 1) {
        const x = i * (world.width / 5) - (farOffset % (world.width / 5));
        ctx.beginPath();
        ctx.moveTo(x, world.groundY);
        ctx.lineTo(x + world.width * 0.12, world.height * 0.42);
        ctx.lineTo(x + world.width * 0.26, world.groundY);
        ctx.closePath();
        ctx.fill();
      }

      const nearOffset = worldOffsetRef.current * 0.42;
      ctx.fillStyle = 'rgba(27, 33, 45, 0.88)';
      for (let i = -1; i < 10; i += 1) {
        const x = i * (world.width / 6) - (nearOffset % (world.width / 6));
        ctx.beginPath();
        ctx.ellipse(x, world.groundY + 12, world.width * 0.11, 46, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = 0.18;
      drawRadiationSymbol(ctx, world.width * 0.82, world.height * 0.22, clamp(world.width * 0.055, 38, 72), '#facc15');
      ctx.restore();
    };

    const drawGround = (world: World) => {
      ctx.fillStyle = '#5b3c21';
      ctx.fillRect(-30, world.groundY, world.width + 60, world.groundHeight);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-30, world.groundY, world.width + 60, 8);
      ctx.fillStyle = 'rgba(15,23,42,0.46)';
      const dash = worldOffsetRef.current % 52;
      for (let x = -52; x < world.width + 52; x += 52) {
        ctx.fillRect(x - dash, world.groundY + 20, 22, 4);
      }
    };

    const drawObstacle = (obstacle: Obstacle) => {
      if (obstacle.kind === 'drone') {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-obstacle.width * 0.36, -3, obstacle.width * 0.72, 6);
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.arc(-obstacle.width * 0.34, 0, obstacle.height * 0.34, 0, Math.PI * 2);
        ctx.arc(obstacle.width * 0.34, 0, obstacle.height * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      if (obstacle.kind === 'bird') {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        const flap = Math.sin(obstacle.phase) * obstacle.height * 0.28;
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.ellipse(0, 0, obstacle.width * 0.34, obstacle.height * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width * 0.12, 0);
        ctx.lineTo(-obstacle.width * 0.48, -flap);
        ctx.moveTo(obstacle.width * 0.12, 0);
        ctx.lineTo(obstacle.width * 0.48, flap);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (obstacle.kind === 'rock') {
        ctx.fillStyle = '#3d342a';
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width * 0.16, obstacle.y + obstacle.height * 0.32);
        ctx.lineTo(obstacle.x + obstacle.width * 0.56, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height * 0.42);
        ctx.lineTo(obstacle.x + obstacle.width * 0.9, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
        return;
      }

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(obstacle.x + obstacle.width * 0.22, obstacle.y + 7, obstacle.width * 0.28, obstacle.height - 7);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(obstacle.x - obstacle.width * 0.32, obstacle.y + obstacle.height * 0.36, obstacle.width * 0.42, obstacle.width * 0.22);
      ctx.fillRect(obstacle.x + obstacle.width * 0.9, obstacle.y + obstacle.height * 0.22, obstacle.width * 0.42, obstacle.width * 0.22);
    };

    const drawPickup = (pickup: Pickup) => {
      const y = pickup.y + Math.sin(pickup.phase) * 8;
      ctx.save();
      ctx.translate(pickup.x, y);
      if (pickup.kind === 'shield') {
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(0, -pickup.radius * 1.35);
        ctx.lineTo(pickup.radius * 1.1, -pickup.radius * 0.32);
        ctx.lineTo(pickup.radius * 0.75, pickup.radius * 1.2);
        ctx.lineTo(0, pickup.radius * 1.55);
        ctx.lineTo(-pickup.radius * 0.75, pickup.radius * 1.2);
        ctx.lineTo(-pickup.radius * 1.1, -pickup.radius * 0.32);
        ctx.closePath();
        ctx.fill();
      } else if (pickup.kind === 'cell') {
        ctx.shadowColor = '#7dd3fc';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-pickup.radius * 0.62, -pickup.radius * 1.35, pickup.radius * 1.24, pickup.radius * 2.7, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(-pickup.radius * 0.36, -pickup.radius, pickup.radius * 0.72, pickup.radius * 2);
        drawRadiationSymbol(ctx, 0, 0, pickup.radius * 0.48, '#facc15');
      } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff7ad';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius * 0.56, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawRunner = (world: World) => {
      const runner = runnerRef.current;
      const crouch = runner.crouching;
      const sliding = runner.slide > 0;
      const size = world.playerSize;
      const height = size * (sliding ? 0.48 : crouch ? 0.62 : 1);
      const width = size * (sliding ? 1.26 : crouch ? 1.12 : 0.86);
      const x = world.playerX;
      const y = runner.y + (sliding ? size * 0.52 : crouch ? size * 0.38 : 0);
      const avatar = activeAvatar();

      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(sliding ? -0.16 : runner.slam ? 0.34 : clamp(runner.vy * 0.00045, -0.28, 0.32));

      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(0, height * 0.58, width * 0.55, height * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = runner.shield > 0 ? '#93c5fd' : sliding ? '#facc15' : '#f7d08a';
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, 12);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-width * 0.4, -height * 0.42, width * 0.8, height * 0.8, 12);
      ctx.clip();
      if (avatar.complete && avatar.naturalWidth > 0) {
        ctx.drawImage(avatar, -width * 0.44, -height * 0.45, width * 0.88, height * 0.88);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-width * 0.44, -height * 0.45, width * 0.88, height * 0.88);
      }
      ctx.restore();

      ctx.strokeStyle = runner.shield > 0 ? '#dbeafe' : '#3d2a1f';
      ctx.lineWidth = runner.shield > 0 ? 5 : 3;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, 12);
      ctx.stroke();

      if (runner.shield > 0) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(width, height) * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (runner.slam) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-width * 0.65, height * 0.2);
        ctx.lineTo(-width * 1.1, height * 0.76);
        ctx.moveTo(width * 0.65, height * 0.2);
        ctx.lineTo(width * 1.1, height * 0.76);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawOverlay = (world: World) => {
      if (phaseRef.current === 'running') return;
      ctx.fillStyle = 'rgba(7, 10, 16, 0.48)';
      ctx.fillRect(-30, 0, world.width + 60, world.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${clamp(world.width * 0.055, 34, 72)}px Georgia`;
      ctx.fillText('Dino Rush', world.width / 2, world.height * 0.35);
      ctx.font = `800 ${clamp(world.width * 0.022, 15, 24)}px Georgia`;
      ctx.fillStyle = '#f5d7a0';
      ctx.fillText(phaseRef.current === 'crashed' ? 'Crashed' : 'Ready', world.width / 2, world.height * 0.42);
    };

    const draw = () => {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current);
      drawBackground(world);
      pickupsRef.current.forEach(drawPickup);
      obstaclesRef.current.forEach(drawObstacle);
      drawGround(world);
      drawRunner(world);

      dustRef.current.forEach(dust => {
        const alpha = clamp(dust.life / dust.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = dust.color;
        ctx.beginPath();
        ctx.arc(dust.x, dust.y, dust.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      drawOverlay(world);
    };

    const loop = (now: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = now;
        rafRef.current = window.requestAnimationFrame(loop);
        return;
      }

      const targetMs = 1000 / frameRateRef.current;
      const elapsed = now - lastTimeRef.current;
      if (elapsed < targetMs - 0.75) {
        rafRef.current = window.requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(0.05, Math.max(0, elapsed / 1000));
      lastTimeRef.current = now - (elapsed % targetMs);
      update(dt);
      draw();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [activeAvatar, addDust, crash, spawnObstacle]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#05070b] text-white">
      <canvas
        ref={canvasRef}
        onPointerDown={event => {
          event.preventDefault();
          requestJump();
        }}
        onPointerUp={event => {
          event.preventDefault();
          releaseJump();
        }}
        onPointerCancel={releaseJump}
        className="absolute inset-0 h-full w-full cursor-pointer select-none touch-none"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-lg border border-white/20 bg-[#10131c]/70 px-2 py-2 shadow-2xl backdrop-blur-md sm:px-3">
          <Button variant="outline" onClick={() => navigate('/menu')} className="pointer-events-auto h-10 rounded-full bg-white/90 px-3 text-[#111827] hover:bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 text-center sm:max-w-2xl">
            <HudStat icon={Gauge} label="Score" value={score} />
            <HudStat icon={Zap} label="Speed" value={speedLabel} />
            <HudStat icon={BatteryCharging} label="Energy" value={`${energy}%`} />
            <HudStat icon={Shield} label="Shield" value={shield > 0 ? shield : '-'} />
          </div>

          <Button variant="outline" onClick={() => reset('ready')} className="pointer-events-auto h-10 rounded-full bg-white/90 px-3 text-[#111827] hover:bg-white">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-3">
          <div className="rounded-lg border border-white/15 bg-[#10131c]/70 px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d7a0]">Best</div>
            <div className="text-2xl font-black tabular-nums">{bestScore}</div>
          </div>

          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <FrameRateSelect value={frameRate} onChange={updateFrameRate} />
            <Button
              onPointerDown={event => {
                event.preventDefault();
                setCrouch(true);
              }}
              onPointerUp={event => {
                event.preventDefault();
                setCrouch(false);
              }}
              onPointerCancel={() => setCrouch(false)}
              className="pointer-events-auto h-16 w-16 rounded-full bg-[#3d2a1f] text-white shadow-xl hover:bg-[#563924] sm:h-20 sm:w-20"
              aria-label="Crouch"
            >
              <ArrowDown className="h-6 w-6" />
            </Button>
            <Button
              onPointerDown={event => {
                event.preventDefault();
                requestJump();
              }}
              onPointerUp={event => {
                event.preventDefault();
                releaseJump();
              }}
              onPointerCancel={releaseJump}
              className="pointer-events-auto h-16 w-16 rounded-full bg-[#f5d7a0] text-[#25180f] shadow-xl hover:bg-[#ffe7b8] sm:h-20 sm:w-20"
              aria-label="Jump"
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

const HudStat: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}> = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 rounded-lg border border-white/10 bg-white/10 px-2 py-1.5">
    <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/65">
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
    </div>
    <div className="truncate text-lg font-black tabular-nums sm:text-xl">{value}</div>
  </div>
);

const FrameRateSelect: React.FC<{
  value: FrameRate;
  onChange: (value: FrameRate) => void;
}> = ({ value, onChange }) => (
  <label className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[#10131c]/70 px-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xl backdrop-blur-md">
    <span className="text-[#f5d7a0]">FPS</span>
    <select
      aria-label="Frame rate"
      value={value}
      onChange={event => onChange(Number(event.target.value) as FrameRate)}
      className="h-8 rounded-full border border-white/15 bg-black/35 px-2 text-sm font-black text-white outline-none"
    >
      {FRAME_RATE_OPTIONS.map(option => (
        <option key={option} value={option} className="bg-[#10131c] text-white">
          {option}
        </option>
      ))}
    </select>
  </label>
);
