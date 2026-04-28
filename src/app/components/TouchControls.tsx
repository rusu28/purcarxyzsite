import React, { useCallback, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { Direction } from '../types/game';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  theme: 'light' | 'dark';
  compact?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onDirectionChange, theme, compact = false }) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const threshold = 24;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) onDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else if (Math.abs(deltaY) > threshold) {
        onDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
      }

      touchStartRef.current = null;
    },
    [onDirectionChange]
  );

  const sizeClass = compact ? 'h-12 w-12' : 'h-14 w-14';
  const boardSize = compact ? 'h-36 w-36' : 'h-44 w-44';
  const dpadButton = `${sizeClass} arcade-control-press rounded-lg flex items-center justify-center text-[#10220e] bg-[#f2c14e] shadow-[0_5px_0_#9f7421] active:translate-y-1 active:shadow-[0_2px_0_#9f7421] transition-all`;
  const shell = theme === 'dark' ? 'border-white/12 bg-black/38' : 'border-[#5c9f32]/25 bg-white/72';

  return (
    <div
      className={`inline-flex rounded-lg border p-3 backdrop-blur-md ${shell}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`relative ${boardSize}`}>
        <button aria-label="Move up" onClick={() => onDirectionChange('UP')} className={`${dpadButton} absolute left-1/2 top-0 -translate-x-1/2`}>
          <ArrowUp className="h-7 w-7" />
        </button>
        <button aria-label="Move left" onClick={() => onDirectionChange('LEFT')} className={`${dpadButton} absolute left-0 top-1/2 -translate-y-1/2`}>
          <ArrowLeft className="h-7 w-7" />
        </button>
        <div className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-lg border-4 border-[#5d822b] bg-[#aad751]" />
        <button aria-label="Move right" onClick={() => onDirectionChange('RIGHT')} className={`${dpadButton} absolute right-0 top-1/2 -translate-y-1/2`}>
          <ArrowRight className="h-7 w-7" />
        </button>
        <button aria-label="Move down" onClick={() => onDirectionChange('DOWN')} className={`${dpadButton} absolute bottom-0 left-1/2 -translate-x-1/2`}>
          <ArrowDown className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
};
