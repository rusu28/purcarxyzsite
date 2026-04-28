import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Award, Gamepad2, Home, LogIn, LogOut, Medal, RefreshCcw, Trophy, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LaunchTimer } from '../components/LaunchTimer';
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/leaderboard';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ARCADE_GAMES } from '../data/arcadeGames';
import type { GameMode } from '../types/game';
import { GAME_MODE_NAMES } from '../types/game';

type ScoreCategory = 'Snake' | 'Quick Games' | 'Retro Arcade' | 'HTML Pack' | 'Geometry';

type ScoreEntry = {
  id: string;
  title: string;
  category: ScoreCategory;
  score: number | null;
  scoreLabel: string;
  route: string;
  detail?: string;
  state?: { mode: GameMode };
};

const ARCADE_SCORE_KEYS: Record<string, string[]> = {
  'retro:computer-space': ['cs_highscore'],
  'retro:space-invaders': ['spaceinvaders_highscore'],
  'retro:asteroids': ['asteroids_highscore'],
  'retro:lunar-lander': ['lunarlander_highscore'],
  'retro:pac-man': ['pacmanHighScore'],
  'retro:centipede': ['centipedeHighScore'],
  'supermario:04-Doodle-Jump-Game': ['doodle-high-score'],
  'supermario:24-Snake-Game': ['high-score'],
};

const SOURCE_CATEGORY: Record<string, ScoreCategory> = {
  retro: 'Retro Arcade',
  supermario: 'HTML Pack',
  geometry: 'Geometry',
};

const readNumber = (key: string): number | null => {
  const raw = localStorage.getItem(key);
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const getGeometryBest = () => {
  let best = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('bestPercent_')) continue;
    const value = Number(localStorage.getItem(key));
    if (Number.isFinite(value)) best = Math.max(best, value);
  }
  return best > 0 ? best : null;
};

const buildLocalScores = (): ScoreEntry[] => {
  const entries: ScoreEntry[] = [];

  try {
    const stored = localStorage.getItem('snake-high-scores');
    const parsed = stored ? JSON.parse(stored) : {};
    Object.entries(GAME_MODE_NAMES).forEach(([mode, title]) => {
      const score = Number(parsed[mode] ?? 0);
      entries.push({
        id: `snake:${mode}`,
        title: `Snake: ${title}`,
        category: 'Snake',
        score: Number.isFinite(score) && score > 0 ? score : null,
        scoreLabel: Number.isFinite(score) && score > 0 ? String(score) : 'No score yet',
        route: '/game',
        state: { mode: mode as GameMode },
      });
    });
  } catch {
    Object.entries(GAME_MODE_NAMES).forEach(([mode, title]) => {
      entries.push({
        id: `snake:${mode}`,
        title: `Snake: ${title}`,
        category: 'Snake',
        score: null,
        scoreLabel: 'No score yet',
        route: '/game',
        state: { mode: mode as GameMode },
      });
    });
  }

  const quickGames: ScoreEntry[] = [
    {
      id: 'quick:flappy',
      title: 'Flappy Purcar',
      category: 'Quick Games',
      score: readNumber('flappy-best-score'),
      scoreLabel: readNumber('flappy-best-score')?.toString() ?? 'No score yet',
      route: '/flappy',
    },
    {
      id: 'quick:dino',
      title: 'Dino Runner',
      category: 'Quick Games',
      score: readNumber('dino-best-score'),
      scoreLabel: readNumber('dino-best-score')?.toString() ?? 'No score yet',
      route: '/dino',
    },
  ];
  entries.push(...quickGames);

  ARCADE_GAMES.forEach(game => {
    const id = `${game.source}:${game.slug}`;
    const category = SOURCE_CATEGORY[game.source] ?? 'HTML Pack';
    const scoreKeys = ARCADE_SCORE_KEYS[id] ?? [];
    const storedScore = scoreKeys.map(readNumber).find(score => score != null) ?? null;
    const geometryScore = game.source === 'geometry' ? getGeometryBest() : null;
    const score = geometryScore ?? storedScore;
    const suffix = game.source === 'geometry' && score != null ? '%' : '';

    entries.push({
      id,
      title: game.title,
      category,
      score,
      scoreLabel: score != null ? `${Math.round(score * 100) / 100}${suffix}` : 'No score yet',
      route: `/arcade/${game.source}/${game.slug}`,
      detail: scoreKeys.length > 0 || game.source === 'geometry' ? undefined : 'This game does not save a high score yet.',
    });
  });

  return entries.sort((a, b) => {
    const aScore = a.score ?? -1;
    const bScore = b.score ?? -1;
    if (bScore !== aScore) return bScore - aScore;
    return a.title.localeCompare(b.title);
  });
};

const clearLocalScoreStorage = () => {
  const knownKeys = [
    'snake-high-scores',
    'flappy-best-score',
    'dino-best-score',
    ...Object.values(ARCADE_SCORE_KEYS).flat(),
  ];
  knownKeys.forEach(key => localStorage.removeItem(key));

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith('bestPercent_')) localStorage.removeItem(key);
  }
};

export const HighScores: React.FC = () => {
  const navigate = useNavigate();

  const [remoteScores, setRemoteScores] = useState<LeaderboardEntry[]>([]);
  const [localScores, setLocalScores] = useState<ScoreEntry[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authMessage, setAuthMessage] = useState<string>('');
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scoredEntries = useMemo(() => localScores.filter(entry => entry.score != null), [localScores]);
  const topScore = scoredEntries[0]?.scoreLabel ?? '0';
  const noScoreCount = localScores.length - scoredEntries.length;

  useEffect(() => {
    const loadLocal = () => setLocalScores(buildLocalScores());

    const loadRemote = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      setLoading(true);
      const [{ data }, userResult] = await Promise.all([fetchLeaderboard(100), supabase.auth.getUser()]);
      setRemoteScores(data);
      setAuthUserEmail(userResult.data.user?.email ?? null);
      setLoading(false);
    };

    loadLocal();
    loadRemote();
  }, []);

  const refreshScores = async () => {
    setLocalScores(buildLocalScores());
    if (!isSupabaseConfigured) return;
    const { data } = await fetchLeaderboard(100);
    setRemoteScores(data);
    if (supabase) {
      const userResult = await supabase.auth.getUser();
      setAuthUserEmail(userResult.data.user?.email ?? null);
    }
  };

  const signIn = async () => {
    if (!supabase) return;
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage('Signed in.');
    await refreshScores();
  };

  const signUp = async () => {
    if (!supabase) return;
    setAuthMessage('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim() || undefined,
        },
      },
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage('Account created. Check email for confirmation if required.');
    await refreshScores();
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUserEmail(null);
    setAuthMessage('Signed out.');
  };

  const clearScores = () => {
    if (!confirm('Clear all local high scores?')) return;
    clearLocalScoreStorage();
    setLocalScores(buildLocalScores());
  };

  const playEntry = (entry: ScoreEntry) => {
    if (entry.state) {
      navigate(entry.route, { state: entry.state });
      return;
    }
    navigate(entry.route);
  };

  return (
    <main className="min-h-screen bg-[#101214] text-white">
      <LaunchTimer />

      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#101214]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
          <Button variant="outline" onClick={() => navigate('/menu')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
            <ArrowLeft className="h-4 w-4" />
            Menu
          </Button>
          <div className="hidden items-center gap-2 text-sm font-black uppercase tracking-[0.18em] sm:flex">
            <Trophy className="h-5 w-5 text-[#f2c14e]" />
            Leaderboard
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <img src="/browser-games-main/screenshots/games-composite.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" draggable={false} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#101214_0%,rgba(16,18,20,0.94)_48%,rgba(16,18,20,0.78)_100%)]" />
        <div className="absolute inset-0 qual-flow-grid opacity-35" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="qual-reveal text-sm font-black uppercase tracking-[0.2em] text-[#83e377]">Scores</p>
            <h1 className="qual-reveal qual-reveal-delay-1 mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              All Games Leaderboard
            </h1>
            <p className="qual-reveal qual-reveal-delay-2 mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Scores from Snake, quick games, retro classics, HTML pack games, and Purcar Dash in one place.
            </p>
          </div>

          <div className="qual-panel qual-reveal qual-reveal-delay-3 rounded-lg border border-white/10 bg-black/30 p-5">
            <Trophy className="h-10 w-10 text-[#f2c14e]" />
            <div className="mt-6 text-5xl font-black tabular-nums">{topScore}</div>
            <div className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-white/50">Top Saved Score</div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[380px_1fr]">
          <aside className="grid gap-4 self-start lg:sticky lg:top-32">
            <section className="qual-panel rounded-lg border border-white/10 bg-[#171a1d] p-5">
              <h2 className="text-xl font-black">Local Score Index</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat value={String(scoredEntries.length)} label="With scores" />
                <MiniStat value={String(noScoreCount)} label="No score yet" />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Some embedded games only expose scores while playing. When a game saves a high score to localStorage, it appears here.
              </p>
            </section>

            {isSupabaseConfigured && (
              <section className="qual-panel rounded-lg border border-white/10 bg-[#171a1d] p-5">
                <h2 className="mb-4 text-xl font-black">Snake Cloud Account</h2>
                <div className="grid gap-3">
                  <Input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} className="border-white/10 bg-black/20 text-white placeholder:text-white/40" />
                  <Input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="border-white/10 bg-black/20 text-white placeholder:text-white/40" />
                  <Input placeholder="username optional" value={username} onChange={e => setUsername(e.target.value)} className="border-white/10 bg-black/20 text-white placeholder:text-white/40" />
                </div>
                <div className="mt-4 grid gap-2">
                  <Button onClick={signIn} className="h-10 rounded-full bg-[#f2c14e] text-[#11100f] hover:bg-[#ffd86f]">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                  <Button onClick={signUp} variant="outline" className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </Button>
                  <Button onClick={signOut} variant="ghost" className="h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/50">
                  Session: {authUserEmail ?? 'not logged in'} {authMessage ? `| ${authMessage}` : ''}. Cloud currently covers Snake scores only.
                </p>
              </section>
            )}

            {isSupabaseConfigured && remoteScores.length > 0 && (
              <section className="qual-panel rounded-lg border border-white/10 bg-[#171a1d] p-5">
                <h2 className="text-xl font-black">Cloud Snake Top</h2>
                <div className="mt-4 grid gap-2">
                  {remoteScores.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{index + 1}. {entry.username}</span>
                      <span className="font-black tabular-nums">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Button onClick={() => navigate('/arcade')} className="h-12 rounded-full bg-white text-[#11100f] hover:bg-[#f2c14e]">
              Play Arcade
            </Button>
            <Button onClick={refreshScores} variant="outline" className="h-12 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={clearScores} variant="outline" className="h-12 rounded-full border-red-400/30 bg-transparent text-red-200 hover:bg-red-500 hover:text-white">
              Clear Local Scores
            </Button>
          </aside>

          <section className="qual-panel rounded-lg border border-white/10 bg-[#171a1d] p-5">
            {loading ? (
              <div className="py-16 text-center text-white/60">Loading leaderboard...</div>
            ) : localScores.length === 0 ? (
              <div className="py-16 text-center">
                <Trophy className="mx-auto h-16 w-16 text-white/20" />
                <h2 className="mt-5 text-2xl font-black">No games found</h2>
              </div>
            ) : (
              <div className="grid gap-3">
                {localScores.map((entry, index) => (
                  <ScoreRow key={entry.id} entry={entry} index={index} onPlay={() => playEntry(entry)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

const MiniStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
    <div className="text-2xl font-black">{value}</div>
    <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{label}</div>
  </div>
);

const ScoreRow: React.FC<{ entry: ScoreEntry; index: number; onPlay: () => void }> = ({ entry, index, onPlay }) => {
  const hasScore = entry.score != null;

  return (
    <article className={`grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-lg border p-3 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 ${hasScore && index < 3 ? 'border-[#f2c14e]/40 bg-[#f2c14e]/10' : 'border-white/10 bg-black/20'}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${hasScore ? 'bg-white text-[#11100f]' : 'bg-white/10 text-white/55'}`}>
        {hasScore ? getRankIcon(index) : <Gamepad2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <h2 className="truncate font-black">{entry.title}</h2>
        <p className="mt-1 truncate text-sm text-white/50">{entry.category}{entry.detail ? ` / ${entry.detail}` : ''}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:block sm:text-right">
        <div>
          <div className={`text-2xl font-black tabular-nums ${hasScore ? 'text-white' : 'text-white/45'}`}>{entry.scoreLabel}</div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{hasScore ? 'best' : 'waiting'}</div>
        </div>
        <Button onClick={onPlay} size="sm" className="shrink-0 rounded-full bg-white text-[#11100f] hover:bg-[#f2c14e]">
          Play
        </Button>
      </div>
    </article>
  );
};

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy className="h-6 w-6 text-[#f2c14e]" />;
  if (index === 1) return <Medal className="h-6 w-6 text-[#cbd5e1]" />;
  if (index === 2) return <Award className="h-6 w-6 text-[#f59e0b]" />;
  return <span className="font-black">#{index + 1}</span>;
};
