import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Bird, Gamepad2, Gauge, Grid3X3, Joystick, Play, Rabbit, Sparkles, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LaunchTimer, LAUNCH_DATE_LABEL, LAUNCH_TITLE, padCountdown, useLaunchCountdown } from '../components/LaunchTimer';
import { ARCADE_GAMES } from '../data/arcadeGames';

const featuredGames = [
  {
    title: 'Purcar Dash',
    meta: 'Geometry run',
    image: '/geometry-dash/assets/game-bg/game_bg_01_001-hd.png',
    route: '/arcade/geometry/geometry-dash',
  },
  {
    title: 'Snake',
    meta: 'Classic modes',
    image: '/img/001-screenshot.png',
    route: '/game',
  },
  {
    title: 'Retro Wall',
    meta: '12 arcade ports',
    image: '/browser-games-main/screenshots/games-composite.png',
    route: '/arcade',
  },
] as const;

const workflow = [
  {
    icon: Grid3X3,
    step: '01',
    title: 'Pick your lane',
    copy: 'Snake modes, quick browser games, and full retro classics sit under one clean launcher.',
  },
  {
    icon: Gauge,
    step: '02',
    title: 'Launch instantly',
    copy: 'Every card opens the playable route directly, including embedded arcade packs.',
  },
  {
    icon: Trophy,
    step: '03',
    title: 'Keep score',
    copy: 'Scores, settings, avatars, and game states stay connected to the same Purcar hub.',
  },
] as const;

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const countdown = useLaunchCountdown();

  return (
    <main className="min-h-screen bg-[#11100f] text-white">
      <LaunchTimer />
      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#11100f]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:h-16 sm:px-6 sm:py-0 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2c14e] text-[#11100f]">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.18em]">Purcar.xyz</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <button type="button" onClick={() => navigate('/arcade')} className="transition-colors hover:text-white">
              Arcade
            </button>
            <button type="button" onClick={() => navigate('/menu')} className="transition-colors hover:text-white">
              Snake Modes
            </button>
            <button type="button" onClick={() => navigate('/high-scores')} className="transition-colors hover:text-white">
              Scores
            </button>
          </nav>

          <Button onClick={() => navigate('/arcade')} className="h-10 rounded-full bg-white px-4 text-[#11100f] hover:bg-[#f2c14e]">
            <Play className="h-4 w-4" />
            Play
          </Button>
        </div>
      </header>

      <section className="relative min-h-[82svh] overflow-hidden">
        <img
          src="/assets/backgroundlandingpage.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,16,15,0.94)_0%,rgba(17,16,15,0.78)_46%,rgba(17,16,15,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,#11100f_0%,rgba(17,16,15,0)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl pt-4">
            <div className="qual-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f2c14e]">
              <Sparkles className="h-3.5 w-3.5" />
              Playground until AI launch
            </div>

            <h1 className="qual-reveal qual-reveal-delay-1 max-w-2xl text-4xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Purcar Playground
            </h1>

            <p className="qual-reveal qual-reveal-delay-2 mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              A temporary game playground while the main Purcar Alpha AI chat is getting ready.
            </p>

            <div className="qual-reveal qual-reveal-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => navigate('/arcade')}
                className="h-12 rounded-full bg-[#f2c14e] px-6 text-[#11100f] hover:bg-[#ffd86f]"
              >
                Open Arcade
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/game', { state: { mode: 'classic' } })}
                variant="outline"
                className="h-12 rounded-full border-white/30 bg-black/25 px-6 text-white hover:bg-white hover:text-[#11100f]"
              >
                Play Snake
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
              <Metric value={`${ARCADE_GAMES.length}+`} label="Games" />
              <Metric value="3" label="Game hubs" />
              <Metric value={LAUNCH_DATE_LABEL} label="AI Chat Launch" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#191817]">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/10 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <QuickLaunch icon={Joystick} title="Arcade" body="Retro, puzzle, action." onClick={() => navigate('/arcade')} />
          <QuickLaunch icon={Bird} title="Flappy" body="One-tap chaos." onClick={() => navigate('/flappy')} />
          <QuickLaunch icon={Rabbit} title="Dino" body="Fast runner." onClick={() => navigate('/dino')} />
        </div>
      </section>

      <section className="bg-[#11100f] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#83e377]">Game selector</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
                Choose a game from a clean arcade catalog.
              </h2>
            </div>
            <Button
              onClick={() => navigate('/arcade')}
              variant="outline"
              className="h-11 rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-[#11100f]"
            >
              View all games
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredGames.map(game => (
              <button
                key={game.title}
                type="button"
                onClick={() => navigate(game.route)}
                className="qual-panel group overflow-hidden rounded-lg border border-white/10 bg-[#1f1d1b] text-left transition-colors hover:border-[#f2c14e]/70"
              >
                <div className="aspect-[16/10] overflow-hidden bg-black">
                  <img
                    src={game.image}
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.04]"
                    draggable={false}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{game.title}</h3>
                    <p className="text-sm text-white/60">{game.meta}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#11100f] transition-colors group-hover:bg-[#f2c14e]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4efe6] px-4 py-16 text-[#11100f] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b13f22]">How it works</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">From landing to play.</h2>
          </div>

          <div className="grid gap-3">
            {workflow.map(item => {
              const Icon = item.icon;
              return (
                <article key={item.step} className="grid gap-4 rounded-lg border border-[#11100f]/10 bg-white p-5 sm:grid-cols-[88px_1fr]">
                  <div className="flex items-center gap-3 sm:block">
                    <span className="text-sm font-black text-[#b13f22]">{item.step}</span>
                    <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#11100f] text-white sm:flex">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{item.title}</h3>
                    <p className="mt-2 leading-7 text-[#3d3832]">{item.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#11100f] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-white/10 bg-[#1f1d1b] md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f2c14e]">Launch queue</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight sm:text-5xl">{LAUNCH_TITLE}</h2>
            <p className="mt-4 max-w-xl leading-7 text-white/70">The countdown tracks the Purcar Alpha AI chat launch on {LAUNCH_DATE_LABEL}. This arcade is the playground until then.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountdownTile value={padCountdown(countdown.days)} label="Days" />
              <CountdownTile value={padCountdown(countdown.hours)} label="Hours" />
              <CountdownTile value={padCountdown(countdown.minutes)} label="Minutes" />
              <CountdownTile value={padCountdown(countdown.seconds)} label="Seconds" />
            </div>
          </div>
          <div className="min-h-[320px] bg-black">
            <img
              src="/browser-games-main/screenshots/games-composite.png"
              alt=""
              className="h-full w-full object-cover opacity-80"
              draggable={false}
            />
          </div>
        </div>
      </section>
    </main>
  );
};

const Metric: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="bg-black/30 px-4 py-4">
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/50">{label}</div>
  </div>
);

const QuickLaunch: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  onClick: () => void;
}> = ({ icon: Icon, title, body, onClick }) => (
  <button type="button" onClick={onClick} className="group bg-[#191817] px-5 py-5 text-left transition-colors hover:bg-[#22201e]">
    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#11100f] transition-colors group-hover:bg-[#83e377]">
      <Icon className="h-5 w-5" />
    </span>
    <h2 className="text-xl font-black text-white">{title}</h2>
    <p className="mt-1 text-sm text-white/60">{body}</p>
  </button>
);

const CountdownTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center">
    <div className="font-mono text-3xl font-black text-[#83e377]">{value}</div>
    <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/50">{label}</div>
  </div>
);
