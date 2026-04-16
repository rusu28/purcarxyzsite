import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Trophy, Medal, Award, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { fetchLeaderboard, type LeaderboardEntry } from '../lib/leaderboard';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { GameMode } from '../types/game';
import { GAME_MODE_NAMES } from '../types/game';

interface LocalHighScoreEntry {
  mode: GameMode;
  score: number;
}

export const HighScores: React.FC = () => {
  const navigate = useNavigate();

  const [remoteScores, setRemoteScores] = useState<LeaderboardEntry[]>([]);
  const [localScores, setLocalScores] = useState<LocalHighScoreEntry[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authMessage, setAuthMessage] = useState<string>('');
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeScores = useMemo(() => (isSupabaseConfigured ? remoteScores : localScores), [remoteScores, localScores]);

  useEffect(() => {
    const loadLocal = () => {
      try {
        const stored = localStorage.getItem('snake-high-scores');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const entries: LocalHighScoreEntry[] = Object.entries(parsed)
          .map(([mode, score]) => ({ mode: mode as GameMode, score: score as number }))
          .filter(entry => entry.score > 0)
          .sort((a, b) => b.score - a.score);
        setLocalScores(entries);
      } catch {
        setLocalScores([]);
      }
    };

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

  const refreshRemote = async () => {
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
    await refreshRemote();
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
    await refreshRemote();
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUserEmail(null);
    setAuthMessage('Signed out.');
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">#{index + 1}</span>;
  };

  const clearScores = () => {
    if (!confirm('Clear local high scores?')) return;
    localStorage.removeItem('snake-high-scores');
    setLocalScores([]);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-neutral-100 to-neutral-300 dark:from-neutral-900 dark:to-black">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/menu')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-4xl font-black text-black dark:text-white">Leaderboard</h1>
          </div>
        </div>

        {isSupabaseConfigured && (
          <Card className="p-4 mb-4 space-y-3">
            <h3 className="font-semibold">Account</h3>
            <div className="grid md:grid-cols-3 gap-2">
              <Input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input placeholder="username (optional)" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={signIn} className="gap-2"><LogIn className="w-4 h-4" />Sign In</Button>
              <Button onClick={signUp} variant="outline" className="gap-2"><UserPlus className="w-4 h-4" />Create Account</Button>
              <Button onClick={signOut} variant="outline" className="gap-2"><LogOut className="w-4 h-4" />Sign Out</Button>
              <Button onClick={refreshRemote} variant="ghost">Refresh</Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Session: {authUserEmail ?? 'not logged in'} {authMessage ? `| ${authMessage}` : ''}
            </p>
          </Card>
        )}

        {!isSupabaseConfigured && (
          <Card className="p-4 mb-4 text-sm text-gray-700 dark:text-gray-300">
            Supabase not configured. Showing local high scores only.
          </Card>
        )}

        <Card className="p-6">
          {loading ? (
            <p className="text-center py-10">Loading leaderboard...</p>
          ) : activeScores.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No high scores yet.</p>
              <Button onClick={() => navigate('/menu')} className="mt-6 bg-black hover:bg-neutral-800 text-white">Play Now</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {activeScores.map((entry, index) => (
                  <div
                    key={isSupabaseConfigured ? (entry as LeaderboardEntry).id : `${(entry as LocalHighScoreEntry).mode}-${index}`}
                    className={`flex items-center gap-4 p-4 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-300 dark:border-neutral-600' : 'bg-gray-50 dark:bg-gray-800'}`}
                  >
                    <div className="flex-shrink-0">{getRankIcon(index)}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {GAME_MODE_NAMES[(entry as any).mode as GameMode]}
                      </h3>
                      {isSupabaseConfigured && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{(entry as LeaderboardEntry).username}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-black dark:text-white">{(entry as any).score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={() => navigate('/menu')} className="flex-1 bg-black hover:bg-neutral-800 text-white">Back to Menu</Button>
                {!isSupabaseConfigured && (
                  <Button onClick={clearScores} variant="outline" className="text-red-600 hover:text-red-700">
                    Clear Local Scores
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
