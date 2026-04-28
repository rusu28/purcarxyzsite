import React from 'react';
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
    <button
      type="button"
      key={mode}
      className={`qual-panel min-h-[104px] rounded-lg border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
        selectedMode === mode
          ? 'border-[#f2c14e] bg-[#f2c14e] text-[#11100f] shadow-[0_12px_30px_rgba(242,193,78,0.18)]'
          : 'border-white/10 bg-[#171a1d] text-white hover:border-white/25 hover:bg-[#202326]'
      }`}
      onClick={() => onSelectMode(mode)}
    >
      <h3 className="mb-1 text-sm font-black">{GAME_MODE_NAMES[mode]}</h3>
      {!compact && <p className={`${selectedMode === mode ? 'text-[#11100f]/75' : 'text-white/55'} text-xs leading-5`}>{GAME_MODE_DESCRIPTIONS[mode]}</p>}
    </button>
  );

  if (compact) {
    return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">{allModes.map(renderModeCard)}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#83e377]">Beginner</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{beginnerModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#83e377]">Intermediate</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{intermediateModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#83e377]">Advanced</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{advancedModes.map(renderModeCard)}</div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#83e377]">Expert</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{expertModes.map(renderModeCard)}</div>
      </div>
    </div>
  );
};
