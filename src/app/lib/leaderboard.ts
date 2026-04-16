import type { GameMode } from '../types/game';
import { supabase } from './supabase';

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  username: string;
  mode: GameMode;
  score: number;
  updated_at: string;
};

export async function submitScore(mode: GameMode, score: number): Promise<{ ok: boolean; reason?: string }> {
  if (!supabase) return { ok: false, reason: 'Supabase is not configured.' };
  if (score <= 0) return { ok: false, reason: 'Score must be greater than 0.' };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, reason: 'Not authenticated.' };

  const user = userData.user;
  const username =
    (typeof user.user_metadata?.username === 'string' && user.user_metadata.username.trim()) ||
    user.email?.split('@')[0] ||
    'player';

  const { data: existing, error: existingError } = await supabase
    .from('snake_scores')
    .select('score')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .maybeSingle();

  if (existingError) return { ok: false, reason: existingError.message };
  if (existing && existing.score >= score) return { ok: true };

  const { error } = await supabase.from('snake_scores').upsert(
    {
      user_id: user.id,
      username,
      mode,
      score,
    },
    { onConflict: 'user_id,mode' }
  );

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function fetchLeaderboard(limit = 50): Promise<{ data: LeaderboardEntry[]; error?: string }> {
  if (!supabase) return { data: [], error: 'Supabase is not configured.' };

  const { data, error } = await supabase
    .from('snake_scores')
    .select('id,user_id,username,mode,score,updated_at')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data as LeaderboardEntry[]) ?? [] };
}
