import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Bird, Gamepad2, Home, Play, Rabbit, Search, Settings, Sparkles, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LaunchTimer } from '../components/LaunchTimer';
import { ARCADE_GAMES, type ArcadeGame, type ArcadeSource } from '../data/arcadeGames';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

type CatalogSource = ArcadeSource | 'quick';
type CatalogFilter = 'all' | CatalogSource;

type CatalogTile = {
  id: string;
  title: string;
  source: CatalogSource;
  label: string;
  route: string;
  year?: number;
  image: string;
  description: string;
  tags: string[];
  featured?: boolean;
  state?: { mode: string };
};

const filters: Array<{ id: CatalogFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'quick', label: 'Quick' },
  { id: 'retro', label: 'Retro' },
  { id: 'supermario', label: 'Web Pack' },
  { id: 'geometry', label: 'Geometry' },
];

const sourceLabels: Record<CatalogSource, string> = {
  quick: 'Quick Launch',
  retro: 'Retro Classic',
  supermario: 'HTML Pack',
  geometry: 'Geometry',
};

const sourceDescriptions: Record<CatalogSource, string> = {
  quick: 'Built-in Purcar games and core routes.',
  retro: 'Arcade classics embedded from the browser-games pack.',
  supermario: 'Small HTML/CSS/JS games collected into one selector.',
  geometry: 'Geometry-style runner with the Purcar skin layer.',
};

const getArcadeImage = (game: ArcadeGame) => {
  if (game.source === 'retro') return `/browser-games-main/${game.slug}/screenshots/gameplay.png`;
  if (game.source === 'geometry') return '/geometry-dash/assets/game-bg/game_bg_01_001-hd.png';
  return '/assets/backgroundlandingpage.jpg';
};

const getArcadeDescription = (game: ArcadeGame) => {
  if (game.source === 'retro') return `Classic ${game.year ?? 'web'} cabinet, playable inside the arcade shell.`;
  if (game.source === 'geometry') return 'Fast geometry runner wrapped into the Purcar launcher.';
  return 'Lightweight browser game from the HTML/CSS/JavaScript pack.';
};

const toArcadeTile = (game: ArcadeGame): CatalogTile => ({
  id: `${game.source}:${game.slug}`,
  title: game.title,
  source: game.source,
  label: sourceLabels[game.source],
  route: `/arcade/${game.source}/${game.slug}`,
  year: game.year,
  image: getArcadeImage(game),
  description: getArcadeDescription(game),
  tags: [sourceLabels[game.source], game.year ? String(game.year) : 'Web'],
  featured: ['retro:space-invaders', 'retro:pac-man', 'geometry:geometry-dash'].includes(`${game.source}:${game.slug}`),
});

const quickLaunchTiles: CatalogTile[] = [
  {
    id: 'quick:snake',
    title: 'Snake Classic',
    source: 'quick',
    label: 'Snake Mode',
    route: '/game',
    state: { mode: 'classic' },
    image: '/img/001-screenshot.png',
    description: 'Core Snake route with your saved settings and Purcar avatar.',
    tags: ['Snake', 'Score'],
    featured: true,
  },
  {
    id: 'quick:flappy',
    title: 'Flappy Purcar',
    source: 'quick',
    label: 'Quick Launch',
    route: '/flappy',
    image: '/img/og-theme.png',
    description: 'Fast side-scroller route from the main game hub.',
    tags: ['Reaction', 'Fast'],
    featured: true,
  },
  {
    id: 'quick:dino',
    title: 'Dino Runner',
    source: 'quick',
    label: 'Quick Launch',
    route: '/dino',
    image: '/img/og-theme-2.png',
    description: 'Runner game with a short jump-and-survive loop.',
    tags: ['Runner', 'Fast'],
  },
  {
    id: 'quick:snake-modes',
    title: 'Snake Modes',
    source: 'quick',
    label: 'Mode Selector',
    route: '/menu',
    image: '/assets/backgroundlandingpage.jpg',
    description: 'All Snake variants collected on the original mode page.',
    tags: ['Modes', 'Settings'],
  },
];

export const RetroArcade: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all');
  const settings = loadStoredSettings();
  const purcarPreview = resolvePurcarAvatar(settings.purcarAvatar, Date.now());

  const catalog = useMemo(() => [...quickLaunchTiles, ...ARCADE_GAMES.map(toArcadeTile)], []);
  const featuredTiles = useMemo(() => catalog.filter(tile => tile.featured).slice(0, 6), [catalog]);

  const filteredTiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog.filter(tile => {
      const matchesFilter = activeFilter === 'all' || tile.source === activeFilter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [tile.title, tile.label, tile.description, ...tile.tags].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [activeFilter, catalog, query]);

  const launchTile = (tile: CatalogTile) => {
    if (tile.state) {
      navigate(tile.route, { state: tile.state });
      return;
    }
    navigate(tile.route);
  };

  const renderTile = (tile: CatalogTile) => (
    <article
      key={tile.id}
      className="qual-panel group overflow-hidden rounded-lg border border-white/10 bg-[#1b1d20] transition-colors hover:border-[#f2c14e]/70"
    >
      <button type="button" onClick={() => launchTile(tile)} className="block w-full text-left">
        <div className="relative aspect-[16/10] overflow-hidden bg-black">
          <img
            src={tile.image}
            alt=""
            className="h-full w-full object-cover opacity-[0.84] transition-transform duration-500 group-hover:scale-[1.04]"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_45%,rgba(0,0,0,0.74)_100%)]" />
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white/80">
            {tile.label}
          </div>
          {tile.source === 'quick' && (
            <img
              src={purcarPreview}
              alt=""
              className="absolute bottom-3 right-3 h-12 w-12 rounded-full border-2 border-white/70 object-cover"
              draggable={false}
            />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{tile.title}</h2>
              <p className="mt-1 min-h-[48px] text-sm leading-6 text-white/60">{tile.description}</p>
            </div>
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#11100f] transition-colors group-hover:bg-[#f2c14e]">
              <Play className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tile.tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
    </article>
  );

  return (
    <main className="min-h-screen bg-[#101214] text-white">
      <LaunchTimer />
      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#101214]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
          <Button variant="outline" onClick={() => navigate('/')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>

          <div className="hidden items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white sm:flex">
            <Gamepad2 className="h-5 w-5 text-[#f2c14e]" />
            Game Selector
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
        <img
          src="/browser-games-main/screenshots/games-composite.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#101214_0%,rgba(16,18,20,0.94)_44%,rgba(16,18,20,0.72)_100%)]" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <div className="qual-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#83e377]">
              <Sparkles className="h-3.5 w-3.5" />
              {catalog.length} playable routes
            </div>
            <h1 className="qual-reveal qual-reveal-delay-1 max-w-3xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">Choose a game and play.</h1>
            <p className="qual-reveal qual-reveal-delay-2 mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Snake, Purcar Dash, retro classics, and the HTML game pack in one fast arcade catalog.
            </p>
          </div>

          <div className="qual-panel qual-reveal qual-reveal-delay-3 rounded-lg border border-white/10 bg-black/30 p-5">
            <div className="flex items-center gap-4">
              <img src={purcarPreview} alt="" className="h-16 w-16 rounded-lg object-cover" draggable={false} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Current skin</p>
                <h2 className="mt-1 text-2xl font-black">Purcar Ready</h2>
              </div>
            </div>
            <Button onClick={() => navigate('/settings')} className="mt-5 h-11 w-full rounded-full bg-white text-[#11100f] hover:bg-[#f2c14e]">
              Customize
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#171a1d] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search games"
              className="h-12 w-full rounded-full border border-white/10 bg-black/30 pl-12 pr-4 text-white placeholder:text-white/40 focus:border-[#f2c14e] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map(filter => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-colors ${
                    isActive ? 'bg-[#f2c14e] text-[#11100f]' : 'border border-white/10 bg-transparent text-white/60 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f2c14e]">Featured</p>
              <h2 className="mt-2 text-3xl font-black">Start here</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')} className="hidden rounded-full text-white/60 hover:bg-white/10 hover:text-white sm:inline-flex">
              <Home className="h-4 w-4" />
              Landing
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featuredTiles.map(renderTile)}</div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0c0e10] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#83e377]">Catalog</p>
              <h2 className="mt-2 text-3xl font-black">{filteredTiles.length} games found</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <SourceStat label="Quick" value={quickLaunchTiles.length} icon={Gamepad2} />
              <SourceStat label="Retro" value={ARCADE_GAMES.filter(game => game.source === 'retro').length} icon={Rabbit} />
              <SourceStat label="Pack" value={ARCADE_GAMES.filter(game => game.source === 'supermario').length} icon={Bird} />
              <SourceStat label="Geometry" value={ARCADE_GAMES.filter(game => game.source === 'geometry').length} icon={Sparkles} />
            </div>
          </div>

          {filteredTiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredTiles.map(renderTile)}</div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#171a1d] p-8 text-center">
              <h2 className="text-2xl font-black">No games found</h2>
              <p className="mt-2 text-white/60">Try another name or switch the filter.</p>
            </div>
          )}

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {(['quick', 'retro', 'supermario', 'geometry'] as CatalogSource[]).map(source => (
              <article key={source} className="rounded-lg border border-white/10 bg-[#171a1d] p-4">
                <h3 className="font-black">{sourceLabels[source]}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{sourceDescriptions[source]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

const SourceStat: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-white/10 bg-[#171a1d] p-4">
    <Icon className="h-4 w-4 text-[#f2c14e]" />
    <div className="mt-3 text-2xl font-black">{value}</div>
    <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{label}</div>
  </div>
);
