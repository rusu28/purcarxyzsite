import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Play, Settings, Trophy, Bird, Rabbit, Gamepad2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ModeSelector } from '../components/ModeSelector';
import type { GameMode } from '../types/game';
import { GAME_MODE_NAMES } from '../types/game';

export const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  const handlePlayGame = () => navigate('/game', { state: { mode: selectedMode } });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-100 to-neutral-300 dark:from-neutral-900 dark:to-black">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black mb-2 text-black dark:text-white">Snake Game</h1>
          <p className="text-gray-600 dark:text-gray-400">Choose your mode and start playing.</p>
        </div>

        <div className="mb-6 max-h-[500px] overflow-y-auto p-2 rounded-lg">
          <ModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handlePlayGame} size="lg" className="gap-2 bg-black hover:bg-neutral-800 text-white">
            <Play className="w-5 h-5" />
            Play {GAME_MODE_NAMES[selectedMode]}
          </Button>
          <Button onClick={() => navigate('/flappy')} size="lg" className="gap-2 bg-[#1b2740] hover:bg-[#26385d] text-white">
            <Bird className="w-5 h-5" />
            Play Flappy Bird
          </Button>
          <Button onClick={() => navigate('/dino')} size="lg" className="gap-2 bg-[#3f3327] hover:bg-[#554433] text-white">
            <Rabbit className="w-5 h-5" />
            Play Dino
          </Button>
          <Button onClick={() => navigate('/arcade')} size="lg" className="gap-2 bg-[#131313] hover:bg-[#222222] text-white">
            <Gamepad2 className="w-5 h-5" />
            Retro Arcade
          </Button>
          <Button
            onClick={() => navigate('/settings')}
            size="lg"
            variant="outline"
            className="gap-2 border-black/40 dark:border-white/40"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Button>
          <Button
            onClick={() => navigate('/high-scores')}
            size="lg"
            variant="outline"
            className="gap-2 border-black/40 dark:border-white/40"
          >
            <Trophy className="w-5 h-5" />
            High Scores
          </Button>
        </div>

        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/')} variant="ghost" className="text-xs text-neutral-600 dark:text-neutral-400">
            Back to Landing
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Desktop: Arrow Keys / WASD. Mobile: swipe or use touch controls.
          </p>
        </div>
      </div>
    </div>
  );
};
