import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Gauge, Play, RefreshCcw, Wind, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type Phase = 'ready' | 'playing' | 'crashed';

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

type Pipe = {
  x: number;
  gapY: number;
  baseGapY: number;
  width: number;
  gap: number;
  passed: boolean;
  amp: number;
  phase: number;
  speed: number;
};

type Ring = {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  phase: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};

type Cloud = {
  x: number;
  y: number;
  width: number;
  speed: number;
  alpha: number;
};

type World = ReturnType<typeof getWorldMetrics>;

const BEST_SCORE_KEY = 'flappy-best-score';
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

const getWorldMetrics = (viewport: Viewport, score: number, time: number) => {
  const { width, height } = viewport;
  const shortSide = Math.min(width, height);
  const progress = clamp(score / 46 + time / 180, 0, 1);
  const groundHeight = clamp(height * 0.145, 70, 145);
  const birdRadius = clamp(shortSide * 0.042, 19, 35);
  const birdX = clamp(width * 0.24, 86, 250);
  const gravity = clamp(height * (1.95 + progress * 0.36), 1180, 2500);
  const flap = -clamp(height * (0.74 + progress * 0.1), 460, 850);
  const maxFall = clamp(height * 1.22, 640, 1280);
  const pipeWidth = clamp(width * 0.075, 56, 112);
  const pipeGap = clamp(height * (0.305 - progress * 0.055), 148, 265);
  const pipeSpeed = clamp(width * (0.205 + progress * 0.105), 185, 520);
  const spawnEvery = clamp(1.38 - progress * 0.25, 0.98, 1.38);
  const liftDrag = 0.996 - progress * 0.01;
  return { width, height, groundHeight, birdRadius, birdX, gravity, flap, maxFall, pipeWidth, pipeGap, pipeSpeed, spawnEvery, liftDrag, progress };
};

const circleRectHit = (
  circleX: number,
  circleY: number,
  radius: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
) => {
  const closestX = clamp(circleX, rectX, rectX + rectWidth);
  const closestY = clamp(circleY, rectY, rectY + rectHeight);
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy < radius * radius;
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

const makeAudio = () => {
  const wing = new Audio('/audio/sfx_wing.wav');
  const point = new Audio('/audio/sfx_point.wav');
  const hit = new Audio('/audio/sfx_hit.wav');
  const die = new Audio('/audio/sfx_die.wav');
  const swoosh = new Audio('/audio/sfx_swooshing.wav');
  [wing, point, hit, die, swoosh].forEach(sound => {
    sound.preload = 'auto';
    sound.volume = 0.42;
  });
  point.volume = 0.55;
  return { wing, point, hit, die, swoosh };
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

export const FlappyBird: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const viewportRef = useRef<Viewport>(getViewport());
  const frameRateRef = useRef<FrameRate>(readStoredFrameRate());

  const phaseRef = useRef<Phase>('ready');
  const scoreRef = useRef(0);
  const bestRef = useRef(Number(localStorage.getItem(BEST_SCORE_KEY) ?? '0'));
  const timeRef = useRef(0);
  const birdYRef = useRef(0);
  const velocityRef = useRef(0);
  const tiltRef = useRef(0);
  const spawnRef = useRef(0);
  const comboRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const gustRef = useRef({ time: 0, force: 0 });

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(bestRef.current);
  const [combo, setCombo] = useState(0);
  const [gust, setGust] = useState(0);
  const [frameRate, setFrameRate] = useState<FrameRate>(frameRateRef.current);
  const [avatarSrc, setAvatarSrc] = useState(() => resolvePurcarAvatar(loadStoredSettings().purcarAvatar, Date.now()));

  const avatarImages = useMemo(makeImages, []);
  const audio = useMemo(makeAudio, []);

  const activeAvatar = useCallback(() => {
    const file = avatarSrc.split('/').pop();
    return avatarImages.find(image => image.src.includes(file ?? '')) ?? avatarImages[0];
  }, [avatarImages, avatarSrc]);

  const playSound = useCallback((sound: HTMLAudioElement) => {
    sound.currentTime = 0;
    void sound.play().catch(() => {});
  }, []);

  const updateFrameRate = useCallback((nextFrameRate: FrameRate) => {
    frameRateRef.current = nextFrameRate;
    setFrameRate(nextFrameRate);
    localStorage.setItem(FRAME_RATE_KEY, String(nextFrameRate));
    lastTimeRef.current = null;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    viewportRef.current = getViewport();
    const { screenWidth, screenHeight, dpr } = viewportRef.current;
    canvas.width = Math.floor(screenWidth * dpr);
    canvas.height = Math.floor(screenHeight * dpr);
    canvas.style.width = `${screenWidth}px`;
    canvas.style.height = `${screenHeight}px`;

    if (phaseRef.current !== 'playing') {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current, timeRef.current);
      birdYRef.current = world.height * 0.38;
    }
  }, []);

  const buildClouds = useCallback(() => {
    const { width, height } = viewportRef.current;
    cloudsRef.current = Array.from({ length: 8 }, (_, index) => ({
      x: Math.random() * width,
      y: height * (0.08 + Math.random() * 0.32),
      width: clamp(width * (0.1 + Math.random() * 0.08), 70, 180),
      speed: clamp(width * (0.015 + Math.random() * 0.02), 14, 52),
      alpha: 0.12 + Math.random() * 0.22,
    }));
  }, []);

  const reset = useCallback((nextPhase: Phase = 'ready') => {
    const world = getWorldMetrics(viewportRef.current, 0, 0);
    phaseRef.current = nextPhase;
    scoreRef.current = 0;
    comboRef.current = 0;
    timeRef.current = 0;
    spawnRef.current = world.spawnEvery * 0.55;
    birdYRef.current = world.height * 0.38;
    velocityRef.current = 0;
    tiltRef.current = 0;
    gustRef.current = { time: 1.6, force: 0 };
    pipesRef.current = [];
    ringsRef.current = [];
    particlesRef.current = [];
    buildClouds();
    setPhase(nextPhase);
    setScore(0);
    setCombo(0);
    setGust(0);
    setAvatarSrc(resolvePurcarAvatar(loadStoredSettings().purcarAvatar, Date.now()));
  }, [buildClouds]);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 190;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        color,
      });
    }
  }, []);

  const spawnPipe = useCallback((world: World) => {
    const margin = Math.max(92, world.height * 0.13);
    const playableBottom = world.height - world.groundHeight - margin;
    const playableTop = margin;
    const gapY = playableTop + Math.random() * Math.max(1, playableBottom - playableTop);
    const moving = scoreRef.current > 5 && Math.random() < 0.42;
    const pipe: Pipe = {
      x: world.width + world.pipeWidth + 24,
      gapY,
      baseGapY: gapY,
      width: world.pipeWidth,
      gap: world.pipeGap,
      passed: false,
      amp: moving ? clamp(world.height * (0.035 + Math.random() * 0.04), 20, 58) : 0,
      phase: Math.random() * Math.PI * 2,
      speed: moving ? 1.25 + Math.random() * 1.2 : 0,
    };
    pipesRef.current.push(pipe);

    if (Math.random() < 0.82) {
      ringsRef.current.push({
        x: pipe.x + pipe.width * 0.5,
        y: pipe.gapY,
        radius: clamp(world.birdRadius * 0.58, 13, 21),
        collected: false,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }, []);

  const finishRun = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'crashed';
    setPhase('crashed');
    comboRef.current = 0;
    setCombo(0);
    spawnParticles(getWorldMetrics(viewportRef.current, scoreRef.current, timeRef.current).birdX, birdYRef.current, '#ff6b6b', 18);
    playSound(audio.hit);
    window.setTimeout(() => playSound(audio.die), 80);
  }, [audio.die, audio.hit, playSound, spawnParticles]);

  const flap = useCallback((strong = false) => {
    if (phaseRef.current === 'crashed') {
      reset('ready');
      playSound(audio.swoosh);
      return;
    }

    if (phaseRef.current === 'ready') {
      phaseRef.current = 'playing';
      setPhase('playing');
      playSound(audio.swoosh);
    }

    const world = getWorldMetrics(viewportRef.current, scoreRef.current, timeRef.current);
    velocityRef.current = strong ? world.flap * 1.08 : world.flap;
    tiltRef.current = -0.45;
    spawnParticles(world.birdX - world.birdRadius * 0.7, birdYRef.current + world.birdRadius * 0.55, '#dbeafe', strong ? 10 : 6);
    playSound(audio.wing);
  }, [audio.swoosh, audio.wing, playSound, reset, spawnParticles]);

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
        flap(event.shiftKey);
      }
      if (event.code === 'KeyR') {
        event.preventDefault();
        reset('ready');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const syncBest = () => {
      if (scoreRef.current <= bestRef.current) return;
      bestRef.current = scoreRef.current;
      setBestScore(bestRef.current);
      localStorage.setItem(BEST_SCORE_KEY, String(bestRef.current));
    };

    const update = (dt: number) => {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current, timeRef.current);

      cloudsRef.current.forEach(cloud => {
        cloud.x -= cloud.speed * dt;
        if (cloud.x + cloud.width < -20) {
          cloud.x = world.width + cloud.width;
          cloud.y = world.height * (0.08 + Math.random() * 0.32);
        }
      });

      particlesRef.current = particlesRef.current
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          vy: particle.vy + 500 * dt,
          life: particle.life - dt,
        }))
        .filter(particle => particle.life > 0);

      if (phaseRef.current !== 'playing') {
        birdYRef.current += Math.sin(performance.now() / 340) * dt * 16;
        tiltRef.current = lerp(tiltRef.current, Math.sin(performance.now() / 500) * 0.1, 0.06);
        return;
      }

      timeRef.current += dt;
      gustRef.current.time -= dt;
      if (gustRef.current.time <= 0) {
        const force = Math.random() < 0.45 ? (Math.random() - 0.5) * world.height * 0.36 : 0;
        gustRef.current = {
          time: 2.4 + Math.random() * 2.9,
          force,
        };
        setGust(Math.round(force));
      }

      spawnRef.current += dt;
      if (spawnRef.current >= world.spawnEvery) {
        spawnRef.current = 0;
        spawnPipe(world);
      }

      velocityRef.current += (world.gravity + gustRef.current.force) * dt;
      velocityRef.current *= Math.pow(world.liftDrag, dt * 60);
      velocityRef.current = clamp(velocityRef.current, world.flap * 1.2, world.maxFall);
      birdYRef.current += velocityRef.current * dt;
      tiltRef.current = lerp(tiltRef.current, clamp(velocityRef.current / world.maxFall, -0.58, 1.12), 0.12);

      pipesRef.current.forEach(pipe => {
        pipe.x -= world.pipeSpeed * dt;
        pipe.phase += pipe.speed * dt;
        pipe.gapY = pipe.baseGapY + Math.sin(pipe.phase) * pipe.amp;

        if (!pipe.passed && pipe.x + pipe.width < world.birdX - world.birdRadius) {
          pipe.passed = true;
          scoreRef.current += 1 + Math.floor(comboRef.current / 4);
          comboRef.current = Math.min(12, comboRef.current + 1);
          setScore(scoreRef.current);
          setCombo(comboRef.current);
          syncBest();
          playSound(audio.point);
          spawnParticles(world.birdX, birdYRef.current, '#facc15', 10);
        }
      });

      pipesRef.current = pipesRef.current.filter(pipe => pipe.x + pipe.width > -80);

      ringsRef.current.forEach(ring => {
        ring.x -= world.pipeSpeed * dt;
        ring.phase += dt * 4;
        if (!ring.collected) {
          const dx = world.birdX - ring.x;
          const dy = birdYRef.current - (ring.y + Math.sin(ring.phase) * 8);
          if (dx * dx + dy * dy < Math.pow(world.birdRadius + ring.radius, 2)) {
            ring.collected = true;
            scoreRef.current += 2;
            comboRef.current = Math.min(12, comboRef.current + 2);
            setScore(scoreRef.current);
            setCombo(comboRef.current);
            syncBest();
            spawnParticles(ring.x, ring.y, '#7dd3fc', 16);
            playSound(audio.point);
          }
        }
      });

      ringsRef.current = ringsRef.current.filter(ring => ring.x > -60 && !ring.collected);

      const hitCeiling = birdYRef.current - world.birdRadius <= 0;
      const hitGround = birdYRef.current + world.birdRadius >= world.height - world.groundHeight;
      const hitPipe = pipesRef.current.some(pipe => {
        const topHeight = pipe.gapY - pipe.gap / 2;
        const bottomY = pipe.gapY + pipe.gap / 2;
        return (
          circleRectHit(world.birdX, birdYRef.current, world.birdRadius * 0.82, pipe.x, 0, pipe.width, topHeight) ||
          circleRectHit(world.birdX, birdYRef.current, world.birdRadius * 0.82, pipe.x, bottomY, pipe.width, world.height - world.groundHeight - bottomY)
        );
      });

      if (hitCeiling || hitGround || hitPipe) finishRun();
    };

    const drawBackground = (world: World, now: number) => {
      const { dpr, offsetX, offsetY, scale, screenHeight, screenWidth } = viewportRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, screenWidth, screenHeight);
      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offsetX * dpr, offsetY * dpr);

      const sky = ctx.createLinearGradient(0, 0, 0, world.height);
      sky.addColorStop(0, '#08111f');
      sky.addColorStop(0.45, '#172339');
      sky.addColorStop(1, '#3a2a18');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, world.width, world.height);

      const glow = ctx.createRadialGradient(world.width * 0.58, world.height * 0.42, 20, world.width * 0.58, world.height * 0.42, world.width * 0.52);
      glow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
      glow.addColorStop(0.36, 'rgba(125, 211, 252, 0.12)');
      glow.addColorStop(1, 'rgba(8, 17, 31, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, world.width, world.height);

      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      const grid = 64;
      const gridOffset = (now * 0.018) % grid;
      for (let x = -grid; x < world.width + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x - gridOffset, 0);
        ctx.lineTo(x - gridOffset + world.height * 0.32, world.height);
        ctx.stroke();
      }
      for (let y = 0; y < world.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridOffset * 0.4);
        ctx.lineTo(world.width, y + gridOffset * 0.4);
        ctx.stroke();
      }
      ctx.restore();

      cloudsRef.current.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = cloud.alpha * 0.9;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width * 0.42, cloud.width * 0.16, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + cloud.width * 0.26, cloud.y + 4, cloud.width * 0.34, cloud.width * 0.13, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x - cloud.width * 0.28, cloud.y + 7, cloud.width * 0.28, cloud.width * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const mountainOffset = (now * 0.012) % Math.max(1, world.width);
      ctx.fillStyle = 'rgba(8, 14, 27, 0.64)';
      for (let i = -1; i < 7; i += 1) {
        const x = i * (world.width / 4) - mountainOffset;
        ctx.beginPath();
        ctx.moveTo(x, world.height - world.groundHeight);
        ctx.lineTo(x + world.width * 0.16, world.height * 0.42);
        ctx.lineTo(x + world.width * 0.34, world.height - world.groundHeight);
        ctx.closePath();
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = 0.2;
      drawRadiationSymbol(ctx, world.width * 0.78, world.height * 0.2, clamp(world.width * 0.055, 38, 72), '#facc15');
      ctx.restore();
    };

    const drawPipe = (world: World, pipe: Pipe) => {
      const topHeight = pipe.gapY - pipe.gap / 2;
      const bottomY = pipe.gapY + pipe.gap / 2;
      const bottomHeight = world.height - world.groundHeight - bottomY;
      const cap = Math.min(22, pipe.width * 0.22);

      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      gradient.addColorStop(0, '#1f2937');
      gradient.addColorStop(0.36, '#64748b');
      gradient.addColorStop(0.52, '#facc15');
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;
      ctx.fillRect(pipe.x, 0, pipe.width, topHeight);
      ctx.fillRect(pipe.x, bottomY, pipe.width, bottomHeight);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pipe.x - 8, topHeight - cap, pipe.width + 16, cap);
      ctx.fillRect(pipe.x - 8, bottomY, pipe.width + 16, cap);
      ctx.fillStyle = 'rgba(250,204,21,0.42)';
      ctx.fillRect(pipe.x + pipe.width * 0.18, 0, Math.max(4, pipe.width * 0.08), Math.max(0, topHeight - cap));
      ctx.fillRect(pipe.x + pipe.width * 0.18, bottomY + cap, Math.max(4, pipe.width * 0.08), Math.max(0, bottomHeight - cap));
      ctx.fillStyle = '#111827';
      for (let y = 18; y < topHeight - cap; y += 42) {
        ctx.fillRect(pipe.x + pipe.width * 0.1, y, pipe.width * 0.8, 5);
      }
      for (let y = bottomY + cap + 18; y < world.height - world.groundHeight; y += 42) {
        ctx.fillRect(pipe.x + pipe.width * 0.1, y, pipe.width * 0.8, 5);
      }
    };

    const drawForeground = (world: World, now: number) => {
      const groundY = world.height - world.groundHeight;
      ctx.fillStyle = '#6b4a24';
      ctx.fillRect(0, groundY, world.width, world.groundHeight);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, groundY, world.width, 8);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
      const tileOffset = (now * world.pipeSpeed * 0.00025) % 40;
      for (let x = -40; x < world.width + 40; x += 40) {
        ctx.fillRect(x - tileOffset, groundY + 18, 18, 4);
      }
    };

    const drawBird = (world: World) => {
      ctx.save();
      ctx.translate(world.birdX, birdYRef.current);
      ctx.rotate(tiltRef.current);

      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(4, world.birdRadius * 1.08, world.birdRadius * 0.95, world.birdRadius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const avatar = activeAvatar();
      const size = world.birdRadius * 2.2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, world.birdRadius, 0, Math.PI * 2);
      ctx.clip();
      if (avatar.complete && avatar.naturalWidth > 0) {
        ctx.drawImage(avatar, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#f8c24d';
        ctx.fillRect(-world.birdRadius, -world.birdRadius, world.birdRadius * 2, world.birdRadius * 2);
      }
      ctx.restore();

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#082f49';
      ctx.beginPath();
      ctx.arc(0, 0, world.birdRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(world.birdRadius * 0.78, -world.birdRadius * 0.12);
      ctx.lineTo(world.birdRadius * 1.34, world.birdRadius * 0.05);
      ctx.lineTo(world.birdRadius * 0.78, world.birdRadius * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawOverlay = (world: World) => {
      if (phaseRef.current === 'playing') return;
      ctx.fillStyle = 'rgba(4, 12, 18, 0.42)';
      ctx.fillRect(0, 0, world.width, world.height);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${clamp(world.width * 0.055, 34, 72)}px Georgia`;
      ctx.fillText('Flappy Run', world.width / 2, world.height * 0.35);
      ctx.font = `800 ${clamp(world.width * 0.022, 15, 24)}px Georgia`;
      ctx.fillStyle = '#dff7ff';
      ctx.fillText(phaseRef.current === 'crashed' ? 'Crashed' : 'Ready', world.width / 2, world.height * 0.42);
    };

    const draw = (now: number) => {
      const world = getWorldMetrics(viewportRef.current, scoreRef.current, timeRef.current);
      drawBackground(world, now);
      pipesRef.current.forEach(pipe => drawPipe(world, pipe));

      ringsRef.current.forEach(ring => {
        ctx.save();
        ctx.translate(ring.x, ring.y + Math.sin(ring.phase) * 8);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        drawRadiationSymbol(ctx, 0, 0, ring.radius * 0.56, '#fde047');
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      drawForeground(world, now);
      drawBird(world);

      particlesRef.current.forEach(particle => {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3 + alpha * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

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
      draw(now);
      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [activeAvatar, audio.die, audio.hit, audio.point, finishRun, playSound, spawnParticles, spawnPipe]);

  const startButtonLabel = phase === 'crashed' ? 'Restart' : 'Launch';

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#05070b] text-white">
      <canvas
        ref={canvasRef}
        onPointerDown={event => {
          event.preventDefault();
          flap(event.pointerType === 'mouse' && event.shiftKey);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer select-none touch-none"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-lg border border-white/20 bg-[#06151b]/70 px-2 py-2 shadow-2xl backdrop-blur-md sm:px-3">
          <Button variant="outline" onClick={() => navigate('/menu')} className="pointer-events-auto h-10 rounded-full bg-white/90 px-3 text-[#08202b] hover:bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 text-center sm:max-w-xl">
            <HudStat icon={Gauge} label="Score" value={score} />
            <HudStat icon={Zap} label="Combo" value={combo} />
            <HudStat icon={Wind} label="Wind" value={gust === 0 ? 'Calm' : gust > 0 ? 'Down' : 'Up'} />
          </div>

          <Button variant="outline" onClick={() => reset('ready')} className="pointer-events-auto h-10 rounded-full bg-white/90 px-3 text-[#08202b] hover:bg-white">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-3">
          <div className="rounded-lg border border-white/15 bg-[#06151b]/65 px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9ce6ff]">Best</div>
            <div className="text-2xl font-black tabular-nums">{bestScore}</div>
          </div>

          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <FrameRateSelect value={frameRate} onChange={updateFrameRate} />
            {phase !== 'playing' && (
              <Button onClick={() => flap(true)} className="pointer-events-auto h-14 rounded-full bg-[#facc15] px-5 text-[#17230d] shadow-xl hover:bg-[#ffe063]">
                <Play className="h-5 w-5" />
                {startButtonLabel}
              </Button>
            )}
            <Button
              onPointerDown={event => {
                event.preventDefault();
                flap(true);
              }}
              className="pointer-events-auto h-16 w-16 rounded-full bg-white text-[#08202b] shadow-xl hover:bg-[#dff7ff] sm:h-20 sm:w-20"
              aria-label="Flap"
            >
              <Zap className="h-6 w-6" />
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
      <span className="hidden xs:inline sm:inline">{label}</span>
    </div>
    <div className="truncate text-lg font-black tabular-nums sm:text-xl">{value}</div>
  </div>
);

const FrameRateSelect: React.FC<{
  value: FrameRate;
  onChange: (value: FrameRate) => void;
}> = ({ value, onChange }) => (
  <label className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[#06151b]/70 px-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xl backdrop-blur-md">
    <span className="text-[#9ce6ff]">FPS</span>
    <select
      aria-label="Frame rate"
      value={value}
      onChange={event => onChange(Number(event.target.value) as FrameRate)}
      className="h-8 rounded-full border border-white/15 bg-black/35 px-2 text-sm font-black text-white outline-none"
    >
      {FRAME_RATE_OPTIONS.map(option => (
        <option key={option} value={option} className="bg-[#06151b] text-white">
          {option}
        </option>
      ))}
    </select>
  </label>
);
