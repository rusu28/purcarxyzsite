import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Pause, Play, RotateCcw, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { GameBoard } from '../components/GameBoard';
import { TouchControls } from '../components/TouchControls';
import { useGameLogic } from '../hooks/useGameLogic';
import type { GameMode, GameSettings, Direction } from '../types/game';
import { submitScore } from '../lib/leaderboard';
import { isSupabaseConfigured } from '../lib/supabase';
import { applyThemeClass, loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

export const Game: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as { mode?: GameMode })?.mode || 'classic';
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const settings: GameSettings = {
    ...loadStoredSettings(),
    mode,
  };
  const [selectedPurcar] = useState(() => resolvePurcarAvatar(settings.purcarAvatar, Date.now()));

  useEffect(() => {
    applyThemeClass(settings.theme);
  }, [settings.theme]);

  const { gameData, isPaused, width, height, resetGame, changeDirection, togglePause } = useGameLogic(settings);
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();

      let direction: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'RIGHT';
          break;
        case ' ':
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetGame();
          break;
        case 'Escape':
          e.preventDefault();
          navigate('/menu');
          break;
      }
      if (direction) changeDirection(direction);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, togglePause, resetGame, navigate]);

  useEffect(() => {
    const saveScore = async () => {
      if (gameData.gameState !== 'gameover' || gameData.score <= 0 || !isSupabaseConfigured) return;
      setSaveState('saving');
      const result = await submitScore(mode, gameData.score);
      setSaveState(result.ok ? 'saved' : 'error');
    };
    saveScore();
  }, [gameData.gameState, gameData.score, mode]);

  const handleDirectionChange = useCallback((direction: Direction) => {
    changeDirection(direction);
  }, [changeDirection]);

  return (
    <main className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-[#120b05]' : 'bg-[#fff5ed]'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <GameBoard gameData={gameData} settings={settings} width={width} height={height} purcarAsset={selectedPurcar} />
      </div>

      <div className="absolute inset-x-0 top-0 z-30 p-3 sm:p-4">
        <div className={`mx-auto max-w-6xl rounded-2xl border px-3 py-2 backdrop-blur-md ${isDark ? 'bg-black/35 border-white/15 text-[#ffd9b4]' : 'bg-white/70 border-black/10 text-[#5a3000]'}`}>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => navigate('/menu')} className="rounded-full">
              <Home className="w-4 h-4" />
            </Button>

            <div className="text-center leading-tight">
              <div className="text-xs uppercase tracking-widest opacity-75">Score / Best</div>
              <div className="text-xl sm:text-2xl font-black tabular-nums">
                {gameData.score} / {gameData.highScore}
              </div>
              {isSupabaseConfigured && (
                <div className="text-[10px] uppercase tracking-wider opacity-70">cloud: {saveState}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={togglePause} className="rounded-full bg-[#0055c4] hover:bg-[#0048a5] text-white">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button onClick={resetGame} className="rounded-full bg-[#8a4c00] hover:bg-[#6f3d00] text-white">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`sm:hidden absolute inset-x-0 bottom-0 z-30 rounded-t-[2rem] border-t px-4 py-4 ${isDark ? 'bg-black/45 border-white/20' : 'bg-white/75 border-black/15'} backdrop-blur-md`}>
        <TouchControls onDirectionChange={handleDirectionChange} theme={settings.theme} />
      </div>

      {gameData.gameState === 'gameover' && (
        <div className="absolute inset-0 z-40 bg-black/55 flex items-center justify-center p-4">
          <div className={`rounded-2xl border p-6 text-center ${isDark ? 'bg-[#1f140d] border-[#4a2f1d] text-[#ffd9b4]' : 'bg-[#fff8f1] border-[#d8ab78] text-[#5a3000]'}`}>
            <h2 className="text-3xl font-black mb-2">Game Over</h2>
            <p className="font-bold mb-4">Score: {gameData.score}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={resetGame} className="bg-[#0055c4] hover:bg-[#0048a5] text-white">
                <RotateCcw className="w-4 h-4 mr-1" /> Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/menu')}>
                <Home className="w-4 h-4 mr-1" /> Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPaused && gameData.gameState === 'playing' && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className={`rounded-xl px-6 py-4 font-bold ${isDark ? 'bg-[#1f140d] text-[#ffd9b4]' : 'bg-white text-[#5a3000]'}`}>
            Paused
          </div>
        </div>
      )}
    </main>
  );
};
