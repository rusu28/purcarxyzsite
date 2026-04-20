import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type Phase = 'ready' | 'play' | 'gameover';

type Obstacle = {
  x: number;
  width: number;
  height: number;
};

type Viewport = {
  width: number;
  height: number;
  dpr: number;
};

const BEST_KEY = 'dino-best-score';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const Dino: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const phaseRef = useRef<Phase>('ready');
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnTimerRef = useRef(0);
  const nextSpawnRef = useRef(1.1);
  const playerYRef = useRef(0);
  const velocityYRef = useRef(0);
  const distanceRef = useRef(0);

  const viewportRef = useRef<Viewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  });

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => Number(localStorage.getItem(BEST_KEY) ?? '0'));
  const [selectedPurcar, setSelectedPurcar] = useState(() => {
    const settings = loadStoredSettings();
    return resolvePurcarAvatar(settings.purcarAvatar, Date.now());
  });

  const headImages = useMemo(() => {
    const imagePaths = [
      '/assets/snake/head.png',
      '/assets/snake/purcar2.jpeg',
      '/assets/snake/purcar3.jpeg',
      '/assets/snake/purcar4.jpeg',
      '/assets/snake/purcar5.jpeg',
      '/assets/snake/purcar6.jpeg',
    ];
    return imagePaths.map(path => {
      const image = new Image();
      image.src = path;
      return image;
    });
  }, []);

  const bgImage = useMemo(() => {
    const image = new Image();
    image.src = '/assets/backgroundlandingpage.jpg';
    return image;
  }, []);

  const getWorld = useCallback(() => {
    const { width, height } = viewportRef.current;
    const groundHeight = clamp(height * 0.18, 90, 210);
    const playerSize = clamp(Math.min(width, height) * 0.1, 56, 110);
    const playerX = clamp(width * 0.14, 80, 300);
    const gravity = clamp(height * 3.5, 1650, 3300);
    const jump = -clamp(height * 1.25, 760, 1280);
    const baseSpeed = clamp(width * 0.36, 280, 760);
    return { width, height, groundHeight, playerSize, playerX, gravity, jump, baseSpeed };
  }, []);

  const reset = useCallback((nextPhase: Phase = 'ready') => {
    const world = getWorld();
    phaseRef.current = nextPhase;
    obstaclesRef.current = [];
    spawnTimerRef.current = 0;
    nextSpawnRef.current = 1.1;
    distanceRef.current = 0;
    velocityYRef.current = 0;
    playerYRef.current = world.height - world.groundHeight - world.playerSize;
    setPhase(nextPhase);
    setScore(0);
    const settings = loadStoredSettings();
    setSelectedPurcar(resolvePurcarAvatar(settings.purcarAvatar, Date.now()));
  }, [getWorld]);

  useEffect(() => {
    reset('ready');
  }, [reset]);

  const handleJump = useCallback(() => {
    if (phaseRef.current === 'gameover') {
      reset('ready');
      return;
    }

    const world = getWorld();
    if (phaseRef.current === 'ready') {
      phaseRef.current = 'play';
      setPhase('play');
    }

    const groundY = world.height - world.groundHeight - world.playerSize;
    if (playerYRef.current >= groundY - 1) {
      velocityYRef.current = world.jump;
    }
  }, [getWorld, reset]);

  useEffect(() => {
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

      if (phaseRef.current !== 'play') {
        const world = getWorld();
        playerYRef.current = world.height - world.groundHeight - world.playerSize;
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getWorld]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleJump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = (dt: number) => {
      const world = getWorld();
      const groundY = world.height - world.groundHeight - world.playerSize;

      if (phaseRef.current !== 'play') return;

      const liveScore = Math.floor(distanceRef.current);
      const progress = Math.min(1, liveScore / 320);
      const easedProgress = 1 - Math.pow(1 - progress, 1.55);
      const speedMultiplier = 1 + easedProgress * 0.9;
      const speed = world.baseSpeed * speedMultiplier;
      const difficulty = 1 + easedProgress * 1.35;

      velocityYRef.current += world.gravity * dt;
      playerYRef.current += velocityYRef.current * dt;
      if (playerYRef.current > groundY) {
        playerYRef.current = groundY;
        velocityYRef.current = 0;
      }

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= nextSpawnRef.current) {
        spawnTimerRef.current = 0;
        const baseDistancePx = clamp(world.width * (0.44 - easedProgress * 0.12), 220, 460);
        const jitterDistancePx = (Math.random() - 0.5) * 80;
        const distanceBasedSpawn = (baseDistancePx + jitterDistancePx) / speed;
        nextSpawnRef.current = clamp(distanceBasedSpawn, 0.58, 1.35);

        const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
        const minReactionWindow = clamp(0.9 - easedProgress * 0.28, 0.62, 0.9);
        const minSpawnGapPx = speed * minReactionWindow;
        const lastObstacleRight = lastObstacle ? lastObstacle.x + lastObstacle.width : -Infinity;
        const canSpawn = !lastObstacle || world.width - lastObstacleRight >= minSpawnGapPx;
        if (canSpawn) {
          const groupChance = 0.08 + easedProgress * 0.2;
          const groupSize = Math.random() < groupChance ? 2 : 1;
          let groupX = world.width + 36;

          for (let i = 0; i < groupSize; i++) {
            const width = clamp(34 + Math.random() * (18 + easedProgress * 8), 30, 62);
            const height = clamp(48 + Math.random() * (34 + easedProgress * 22), 48, 118);
            obstaclesRef.current.push({ x: groupX + width, width, height });
            const groupGapBase = 50 - easedProgress * 12;
            groupX += width + clamp(groupGapBase + Math.random() * 12, 28, 64);
          }
        } else {
          nextSpawnRef.current = clamp(nextSpawnRef.current * 0.45, 0.18, 0.4);
        }
      }

      obstaclesRef.current = obstaclesRef.current.filter(obstacle => obstacle.x + obstacle.width > -20);
      obstaclesRef.current.forEach(obstacle => {
        obstacle.x -= speed * dt;
      });

      distanceRef.current += dt * (9.8 + difficulty * 1.15);
      const nextScore = Math.floor(distanceRef.current);
      if (nextScore !== score) {
        setScore(nextScore);
        if (nextScore > bestScore) {
          setBestScore(nextScore);
          localStorage.setItem(BEST_KEY, String(nextScore));
        }
      }

      const playerBox = {
        x: world.playerX + world.playerSize * 0.15,
        y: playerYRef.current + world.playerSize * 0.15,
        w: world.playerSize * 0.7,
        h: world.playerSize * 0.72,
      };

      const hit = obstaclesRef.current.some(obstacle => {
        const obsY = world.height - world.groundHeight - obstacle.height;
        return (
          playerBox.x < obstacle.x + obstacle.width &&
          playerBox.x + playerBox.w > obstacle.x &&
          playerBox.y < obsY + obstacle.height &&
          playerBox.y + playerBox.h > obsY
        );
      });

      if (hit) {
        phaseRef.current = 'gameover';
        setPhase('gameover');
      }
    };

    const draw = (time: number) => {
      const world = getWorld();
      const { width, height, dpr } = viewportRef.current;
      const groundY = height - world.groundHeight;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#cbe6ff';
        ctx.fillRect(0, 0, width, height);
      }

      const hillOffset = (time * 0.03) % width;
      ctx.fillStyle = 'rgba(8, 16, 28, 0.25)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#9fcf7b';
      for (let i = -1; i < 6; i++) {
        const x = i * (width / 5) - hillOffset;
        ctx.beginPath();
        ctx.ellipse(x + width / 10, groundY + 16, width / 8, 62, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#72b255';
      ctx.fillRect(0, groundY, width, world.groundHeight);
      ctx.fillStyle = '#5b9242';
      for (let x = 0; x < width; x += 32) {
        ctx.fillRect(x, groundY + 10, 3, world.groundHeight - 10);
      }

      obstaclesRef.current.forEach(obstacle => {
        const obsY = height - world.groundHeight - obstacle.height;

        ctx.fillStyle = '#2f3b22';
        ctx.fillRect(obstacle.x, obsY, obstacle.width, obstacle.height);
        ctx.fillStyle = '#425432';
        ctx.fillRect(obstacle.x + 6, obsY + 6, obstacle.width * 0.3, obstacle.height - 12);
      });

      const tilt = clamp(velocityYRef.current * 0.0006, -0.4, 0.65);
      ctx.save();
      ctx.translate(world.playerX + world.playerSize / 2, playerYRef.current + world.playerSize / 2);
      ctx.rotate(tilt);
      const activeHead = headImages.find(img => img.src.includes(selectedPurcar.split('/').pop() ?? '')) ?? headImages[0];
      if (activeHead.complete) {
        ctx.drawImage(activeHead, -world.playerSize / 2, -world.playerSize / 2, world.playerSize, world.playerSize);
      } else {
        ctx.fillStyle = '#fefefe';
        ctx.beginPath();
        ctx.arc(0, 0, world.playerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (phaseRef.current !== 'play') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = "700 52px 'Arial'";
        ctx.fillText('DINO RUNNER', width / 2, Math.max(180, height * 0.34));
        ctx.font = "600 22px 'Arial'";
        if (phaseRef.current === 'ready') ctx.fillText('Press SPACE or TAP to jump', width / 2, Math.max(230, height * 0.44));
        else ctx.fillText('Game Over - Press SPACE or TAP', width / 2, Math.max(230, height * 0.44));
      }
    };

    const loop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      update(dt);
      draw(time);

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [bestScore, bgImage, getWorld, headImages, selectedPurcar, score]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} onClick={handleJump} className="absolute inset-0 cursor-pointer select-none" />

      <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => navigate('/menu')} className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="text-center leading-tight">
              <div className="text-xs uppercase tracking-widest text-[#b8d58f]">Score / Best</div>
              <div className="text-xl sm:text-2xl font-black tabular-nums">{score} / {bestScore}</div>
            </div>

            <Button variant="outline" onClick={() => reset('ready')} className="rounded-full">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {phase !== 'play' && <div className="absolute bottom-6 inset-x-0 z-20 text-center text-sm sm:text-base text-white/90">SPACE sau click/tap ca sa incepi</div>}
    </main>
  );
};
