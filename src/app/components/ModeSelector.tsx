import React from 'react';
import { Card } from './ui/card';
import type { GameMode } from '../types/game';
import { GAME_MODE_NAMES, GAME_MODE_DESCRIPTIONS } from '../types/game';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  compact?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onSelectMode, compact = false }) => {
  const beginnerModes: GameMode[] = ['classic', 'borderless', 'peaceful'];
  const intermediateModes: GameMode[] = ['wall', 'statue', 'portal', 'gate', 'cheese', 'poison'];
  const advancedModes: GameMode[] = ['key', 'sokoban', 'twin', 'winged', 'yinyang'];
  const expertModes: GameMode[] = ['dimension', 'minesweeper', 'light', 'shield', 'arrow', 'hotdog', 'magnet', 'blender'];

  const allModes = [...beginnerModes, ...intermediateModes, ...advancedModes, ...expertModes];

  const renderModeCard = (mode: GameMode) => (
    <Card
      key={mode}
      className={`p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        selectedMode === mode
          ? 'ring-2 ring-black dark:ring-white bg-black text-white dark:bg-white dark:text-black'
          : 'bg-white/70 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
      onClick={() => onSelectMode(mode)}
    >
      <h3 className="font-bold text-sm mb-1">{GAME_MODE_NAMES[mode]}</h3>
      {!compact && <p className={`${selectedMode === mode ? 'text-white/85 dark:text-black/80' : 'text-gray-600 dark:text-gray-400'} text-xs`}>{GAME_MODE_DESCRIPTIONS[mode]}</p>}
    </Card>
  );

  if (compact) {
    return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">{allModes.map(renderModeCard)}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2 text-black dark:text-white">Beginner</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{beginnerModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2 text-black dark:text-white">Intermediate</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{intermediateModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2 text-black dark:text-white">Advanced</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{advancedModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2 text-black dark:text-white">Expert</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{expertModes.map(renderModeCard)}</div>
      </div>
    </div>
  );
};
