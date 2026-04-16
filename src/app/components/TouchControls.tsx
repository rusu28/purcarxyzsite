import React, { useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Direction } from '../types/game';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  theme: 'light' | 'dark';
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onDirectionChange, theme }) => {
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
      const threshold = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) onDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else if (Math.abs(deltaY) > threshold) {
        onDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
      }

      touchStartRef.current = null;
    },
    [onDirectionChange]
  );

  const dpadButton =
    'w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#3b82f6] shadow-[0_5px_0_0_#113b83] active:translate-y-1 active:shadow-[0_2px_0_0_#113b83] transition-all';

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div
        className={`w-full max-w-[320px] h-16 rounded-2xl border-2 border-dashed ${
          theme === 'dark' ? 'border-[#6b563d] bg-[#2b1b0f]' : 'border-[#d3a56e] bg-[#ffe6c7]'
        } flex items-center justify-center text-xs font-semibold tracking-wide text-[#8a4c00]`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        SWIPE CONTROL ZONE
      </div>

      <div className="relative w-44 h-44">
        <button onClick={() => onDirectionChange('UP')} className={`${dpadButton} absolute top-0 left-1/2 -translate-x-1/2`}>
          <ArrowUp className="w-7 h-7" />
        </button>
        <button onClick={() => onDirectionChange('LEFT')} className={`${dpadButton} absolute left-0 top-1/2 -translate-y-1/2`}>
          <ArrowLeft className="w-7 h-7" />
        </button>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#1f4ea5] border-4 border-[#113b83]" />
        <button onClick={() => onDirectionChange('RIGHT')} className={`${dpadButton} absolute right-0 top-1/2 -translate-y-1/2`}>
          <ArrowRight className="w-7 h-7" />
        </button>
        <button onClick={() => onDirectionChange('DOWN')} className={`${dpadButton} absolute bottom-0 left-1/2 -translate-x-1/2`}>
          <ArrowDown className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
