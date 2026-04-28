import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Bird, Gamepad2, Home, Play, Rabbit, Settings, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LaunchTimer } from '../components/LaunchTimer';
import { ModeSelector } from '../components/ModeSelector';
import type { GameMode } from '../types/game';
import { GAME_MODE_NAMES } from '../types/game';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

export const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const purcarPreview = resolvePurcarAvatar(loadStoredSettings().purcarAvatar, Date.now());

  const handlePlayGame = () => navigate('/game', { state: { mode: selectedMode } });

  return (
    <main className="min-h-screen bg-[#101214] text-white">
      <LaunchTimer />

      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#101214]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
          <Button variant="outline" onClick={() => navigate('/')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
            <Home className="h-4 w-4" />
            Home
          </Button>
          <div className="hidden items-center gap-2 text-sm font-black uppercase tracking-[0.18em] sm:flex">
            <Gamepad2 className="h-5 w-5 text-[#f2c14e]" />
            Snake Modes
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/high-scores')} className="h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Scores</span>
            </Button>
            <Button variant="ghost" onClick={() => navigate('/settings')} className="h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <img src="/assets/backgroundlandingpage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" draggable={false} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#101214_0%,rgba(16,18,20,0.92)_48%,rgba(16,18,20,0.76)_100%)]" />
        <div className="absolute inset-0 qual-flow-grid opacity-45" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div>
            <p className="qual-reveal text-sm font-black uppercase tracking-[0.2em] text-[#83e377]">Mode selector</p>
            <h1 className="qual-reveal qual-reveal-delay-1 mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              The Snake Game
            </h1>
            <p className="qual-reveal qual-reveal-delay-2 mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Pick a mode and start playing with keyboard, touch, or the on-screen D-pad.
            </p>

            <div className="qual-reveal qual-reveal-delay-3 mt-7 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handlePlayGame} className="h-12 rounded-full bg-[#f2c14e] px-6 text-[#11100f] hover:bg-[#ffd86f]">
                <Play className="h-4 w-4" />
                Play {GAME_MODE_NAMES[selectedMode]}
              </Button>
              <Button onClick={() => navigate('/arcade')} variant="outline" className="h-12 rounded-full border-white/25 bg-transparent px-6 text-white hover:bg-white hover:text-[#11100f]">
                Full Arcade
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="qual-panel qual-float rounded-lg border border-white/10 bg-black/30 p-5">
            <div className="aspect-square rounded-lg border border-white/10 bg-[#15191d] p-5">
              <div className="relative h-full overflow-hidden rounded-lg bg-[#aad751]">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.16)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.16)_50%,rgba(255,255,255,0.16)_75%,transparent_75%,transparent)] bg-[length:44px_44px]" />
                <img src="/assets/apple.png" alt="" className="absolute right-[18%] top-[16%] h-12 w-12 object-contain" draggable={false} />
                <img src="/assets/mango.png" alt="" className="absolute bottom-[20%] left-[18%] h-12 w-12 object-contain" draggable={false} />
                <div className="absolute left-[28%] top-[48%] flex items-center gap-1">
                  {[0, 1, 2, 3].map(index => (
                    <span key={index} className="h-12 w-12 rounded-lg bg-[#4aa833] shadow-[inset_0_3px_0_rgba(255,255,255,0.22)]" />
                  ))}
                  <img src={purcarPreview} alt="" className="h-14 w-14 rounded-lg border-2 border-[#26681d] object-cover" draggable={false} />
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <MiniStat value="22" label="Modes" />
              <MiniStat value="Touch" label="Ready" />
              <MiniStat value="Score" label="Saved" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_320px]">
          <div className="pr-1 lg:max-h-[760px] lg:overflow-y-auto">
            <ModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} />
          </div>

          <aside className="grid gap-3 self-start lg:sticky lg:top-32">
            <QuickRoute icon={Bird} title="Flappy" onClick={() => navigate('/flappy')} />
            <QuickRoute icon={Rabbit} title="Dino" onClick={() => navigate('/dino')} />
            <QuickRoute icon={Gamepad2} title="Retro Arcade" onClick={() => navigate('/arcade')} />
            <Button onClick={handlePlayGame} className="mt-2 h-12 rounded-full bg-white text-[#11100f] hover:bg-[#f2c14e]">
              <Play className="h-4 w-4" />
              Start Selected
            </Button>
          </aside>
        </div>
      </section>
    </main>
  );
};

const MiniStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
    <div className="text-sm font-black text-white">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{label}</div>
  </div>
);

const QuickRoute: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}> = ({ icon: Icon, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="qual-panel flex items-center justify-between rounded-lg border border-white/10 bg-[#171a1d] p-4 text-left transition-colors hover:border-[#f2c14e]/70"
  >
    <span className="flex items-center gap-3 font-black">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#11100f]">
        <Icon className="h-5 w-5" />
      </span>
      {title}
    </span>
    <ArrowRight className="h-4 w-4 text-white/50" />
  </button>
);
