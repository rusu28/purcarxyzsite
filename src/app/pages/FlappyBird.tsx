import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type GamePhase = 'ready' | 'play' | 'gameover';

type Pipe = {
  x: number;
  gapY: number;
  passed: boolean;
};

type Viewport = {
  width: number;
  height: number;
  dpr: number;
};

const BEST_SCORE_KEY = 'flappy-best-score';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const FlappyBird: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const pipesRef = useRef<Pipe[]>([]);
  const birdYRef = useRef(0);
  const velocityRef = useRef(0);
  const phaseRef = useRef<GamePhase>('ready');
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const viewportRef = useRef<Viewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  });

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => Number(localStorage.getItem(BEST_SCORE_KEY) ?? '0'));
  const [selectedPurcar, setSelectedPurcar] = useState(() => {
    const settings = loadStoredSettings();
    return resolvePurcarAvatar(settings.purcarAvatar, Date.now());
  });

  const birdImages = useMemo(() => {
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

  const sfx = useMemo(() => {
    const wing = new Audio('/audio/sfx_wing.wav');
    const point = new Audio('/audio/sfx_point.wav');
    const hit = new Audio('/audio/sfx_hit.wav');
    const die = new Audio('/audio/sfx_die.wav');
    const swoosh = new Audio('/audio/sfx_swooshing.wav');
    return { wing, point, hit, die, swoosh };
  }, []);

  const getWorld = useCallback(() => {
    const { width, height } = viewportRef.current;
    const groundHeight = clamp(height * 0.14, 76, 150);
    const pipeWidth = clamp(width * 0.075, 62, 114);
    const pipeGap = clamp(height * 0.27, 170, 280);
    const birdSize = clamp(Math.min(width, height) * 0.075, 44, 76);
    const birdX = clamp(width * 0.24, 90, 260);
    const pipeSpeed = clamp(width * 0.26, 260, 560);
    const gravity = clamp(height * 2.3, 1450, 2600);
    const flap = -clamp(height * 0.95, 620, 980);
    return { width, height, groundHeight, pipeWidth, pipeGap, birdSize, birdX, pipeSpeed, gravity, flap };
  }, []);

  const resetGame = useCallback((nextPhase: GamePhase = 'ready') => {
    const world = getWorld();
    pipesRef.current = [];
    birdYRef.current = world.height * 0.35;
    velocityRef.current = 0;
    scoreRef.current = 0;
    spawnTimerRef.current = 0;
    phaseRef.current = nextPhase;
    setScore(0);
    setPhase(nextPhase);
    const settings = loadStoredSettings();
    setSelectedPurcar(resolvePurcarAvatar(settings.purcarAvatar, Date.now()));
  }, [getWorld]);

  useEffect(() => {
    resetGame('ready');
  }, [resetGame]);

  const startOrFlap = useCallback(() => {
    if (phaseRef.current === 'gameover') {
      resetGame('ready');
      sfx.swoosh.currentTime = 0;
      void sfx.swoosh.play().catch(() => {});
      return;
    }

    if (phaseRef.current === 'ready') {
      phaseRef.current = 'play';
      setPhase('play');
      sfx.swoosh.currentTime = 0;
      void sfx.swoosh.play().catch(() => {});
    }

    const world = getWorld();
    velocityRef.current = world.flap;
    sfx.wing.currentTime = 0;
    void sfx.wing.play().catch(() => {});
  }, [getWorld, resetGame, sfx]);

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
        birdYRef.current = world.height * 0.35;
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getWorld]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        startOrFlap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [startOrFlap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const world = getWorld();
      const { width, height, dpr } = viewportRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#6ec5ff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = 'rgba(8, 14, 24, 0.25)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      for (let i = 0; i < width; i += 42) {
        for (let j = 0; j < height - world.groundHeight; j += 42) {
          ctx.fillRect(i, j, 2, 2);
        }
      }

      pipesRef.current.forEach(pipe => {
        const topHeight = pipe.gapY - world.pipeGap / 2;
        const bottomY = pipe.gapY + world.pipeGap / 2;
        const bottomHeight = height - world.groundHeight - bottomY;

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, 0, world.pipeWidth, topHeight);
        ctx.fillRect(pipe.x, bottomY, world.pipeWidth, bottomHeight);

        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(pipe.x - 6, topHeight - 18, world.pipeWidth + 12, 18);
        ctx.fillRect(pipe.x - 6, bottomY, world.pipeWidth + 12, 18);
      });

      ctx.fillStyle = '#d7c0a4';
      ctx.fillRect(0, height - world.groundHeight, width, world.groundHeight);
      ctx.fillStyle = '#c0aa8f';
      for (let x = 0; x < width; x += 24) ctx.fillRect(x, height - world.groundHeight, 2, world.groundHeight);

      const birdY = birdYRef.current;
      const rotation = Math.max(-0.5, Math.min(1.25, velocityRef.current * 0.0014));
      ctx.save();
      ctx.translate(world.birdX, birdY);
      ctx.rotate(rotation);
      const activeBird = birdImages.find(img => img.src.includes(selectedPurcar.split('/').pop() ?? '')) ?? birdImages[0];
      if (activeBird.complete) {
        ctx.drawImage(activeBird, -world.birdSize / 2, -world.birdSize / 2, world.birdSize, world.birdSize);
      } else {
        ctx.fillStyle = '#ffcb54';
        ctx.beginPath();
        ctx.arc(0, 0, world.birdSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (phaseRef.current !== 'play') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = "700 44px 'Arial'";
        ctx.fillText('FLAPPY BIRD', width / 2, Math.max(180, height * 0.34));
        ctx.font = "600 20px 'Arial'";
        if (phaseRef.current === 'ready') ctx.fillText('Press SPACE or TAP to start', width / 2, Math.max(230, height * 0.45));
        else ctx.fillText('Game Over - Press SPACE or TAP', width / 2, Math.max(230, height * 0.45));
      }
    };

    const update = (dt: number) => {
      if (phaseRef.current !== 'play') return;

      const world = getWorld();

      velocityRef.current += world.gravity * dt;
      birdYRef.current += velocityRef.current * dt;

      spawnTimerRef.current += dt;
      const spawnEvery = 1.25;
      if (spawnTimerRef.current >= spawnEvery) {
        spawnTimerRef.current = 0;
        const minGapY = 120;
        const maxGapY = world.height - world.groundHeight - 120;
        pipesRef.current.push({
          x: world.width + world.pipeWidth,
          gapY: Math.random() * (maxGapY - minGapY) + minGapY,
          passed: false,
        });
      }

      pipesRef.current = pipesRef.current.filter(pipe => pipe.x + world.pipeWidth > -32);
      pipesRef.current.forEach(pipe => {
        pipe.x -= world.pipeSpeed * dt;
        if (!pipe.passed && pipe.x + world.pipeWidth < world.birdX) {
          pipe.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          sfx.point.currentTime = 0;
          void sfx.point.play().catch(() => {});
          if (scoreRef.current > bestScore) {
            setBestScore(scoreRef.current);
            localStorage.setItem(BEST_SCORE_KEY, String(scoreRef.current));
          }
        }
      });

      const birdLeft = world.birdX - world.birdSize * 0.32;
      const birdRight = world.birdX + world.birdSize * 0.32;
      const birdTop = birdYRef.current - world.birdSize * 0.32;
      const birdBottom = birdYRef.current + world.birdSize * 0.32;

      const hitGround = birdBottom >= world.height - world.groundHeight;
      const hitCeiling = birdTop <= 0;
      const hitPipe = pipesRef.current.some(pipe => {
        const topHeight = pipe.gapY - world.pipeGap / 2;
        const bottomY = pipe.gapY + world.pipeGap / 2;
        const overlapX = birdRight > pipe.x && birdLeft < pipe.x + world.pipeWidth;
        const overlapTop = birdTop < topHeight;
        const overlapBottom = birdBottom > bottomY;
        return overlapX && (overlapTop || overlapBottom);
      });

      if (hitGround || hitCeiling || hitPipe) {
        phaseRef.current = 'gameover';
        setPhase('gameover');
        sfx.hit.currentTime = 0;
        void sfx.hit.play().catch(() => {});
        sfx.die.currentTime = 0;
        void sfx.die.play().catch(() => {});
      }
    };

    const gameLoop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      update(dt);
      draw();
      rafRef.current = window.requestAnimationFrame(gameLoop);
    };

    rafRef.current = window.requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [bestScore, bgImage, birdImages, getWorld, selectedPurcar, sfx]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} onClick={startOrFlap} className="absolute inset-0 cursor-pointer select-none" />

      <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => navigate('/menu')} className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="text-center leading-tight">
              <div className="text-xs uppercase tracking-widest text-[#8ea4d9]">Score / Best</div>
              <div className="text-xl sm:text-2xl font-black tabular-nums">{score} / {bestScore}</div>
            </div>

            <Button variant="outline" onClick={() => resetGame('ready')} className="rounded-full">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {phase !== 'play' && <div className="absolute bottom-6 inset-x-0 z-20 text-center text-sm sm:text-base text-white/90">SPACE sau click/tap ca sa incepi</div>}
    </main>
  );
};
