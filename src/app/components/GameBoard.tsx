import React, { useEffect, useState } from 'react';
import type { Apple, Direction, GameData, GameSettings } from '../types/game';
import { getColorForEntity } from '../utils/gameHelpers';

interface GameBoardProps {
  gameData: GameData;
  settings: GameSettings;
  width: number;
  height: number;
  purcarAsset: string;
}

const FRUIT_ASSETS: Record<Apple['type'], string> = {
  normal: '/assets/apple.png',
  golden: '/assets/mango.png',
  poison: '/assets/orange.png',
  cheese: '/assets/banana.png',
};

const HEAD_FALLBACK = '/assets/snake/head.jpeg';

export const GameBoard: React.FC<GameBoardProps> = ({ gameData, settings, width, height, purcarAsset }) => {
  const { snake, secondSnake, apples, entities, portals, shieldActive, lightRadius, blenderPhase } = gameData;
  const { mode, theme, speed } = settings;

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewport.width < 768;
  const maxBoardWidth = isMobile ? viewport.width - 12 : viewport.width - 320;
  const maxBoardHeight = isMobile ? viewport.height - 280 : viewport.height - 130;
  const cellSize = Math.max(isMobile ? 10 : 16, Math.min(64, Math.floor(Math.min(maxBoardWidth / width, maxBoardHeight / height))));
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;
  const moveDuration = speed === 'fast' ? 38 : speed === 'normal' ? 62 : 92;

  const getTranslate = (x: number, y: number) => `translate3d(${x * cellSize}px, ${y * cellSize}px, 0)`;

  const getCellStyle = (x: number, y: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: cellSize,
    height: cellSize,
    borderRadius: Math.max(3, Math.floor(cellSize * 0.16)),
    transform: getTranslate(x, y),
    transitionProperty: 'transform, opacity',
    transitionDuration: `${moveDuration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    willChange: 'transform',
  });

  const isInLightRadius = (x: number, y: number): boolean => {
    if (mode !== 'light') return true;
    const head = snake.body[0];
    return Math.abs(head.x - x) + Math.abs(head.y - y) <= lightRadius;
  };

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-lg border-[6px] ${
        theme === 'dark'
          ? 'border-[#20351a] bg-[#8ec043] shadow-[0_10px_0_0_#111d0e,0_24px_50px_rgba(0,0,0,0.38)]'
          : 'border-[#5f9f38] bg-[#aad751] shadow-[0_10px_0_0_#497a2a,0_24px_50px_rgba(53,86,21,0.22)]'
      }`}
      style={{ width: boardWidth, height: boardHeight }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: theme === 'dark' ? '#8ec043' : '#aad751',
          backgroundImage: `linear-gradient(45deg, ${
            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.16)'
          } 25%, transparent 25%, transparent 75%, ${
            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.16)'
          } 75%), linear-gradient(45deg, ${
            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.16)'
          } 25%, transparent 25%, transparent 75%, ${
            theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.16)'
          } 75%)`,
          backgroundPosition: `0 0, ${cellSize}px ${cellSize}px`,
          backgroundSize: `${cellSize * 2}px ${cellSize * 2}px`,
        }}
      />

      {portals.map((portal, idx) => (
        <React.Fragment key={`portal-${idx}`}>
          <div
            style={{
              ...getCellStyle(portal.entrance.x, portal.entrance.y),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #faf5ff 0%, #b786ff 50%, #7a3fd8 100%)',
              boxShadow: '0 0 16px rgba(124,73,255,0.65)',
            }}
            className="portal-pulse"
          />
          <div
            style={{
              ...getCellStyle(portal.exit.x, portal.exit.y),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff7fb 0%, #ff9ad9 50%, #ff4db9 100%)',
              boxShadow: '0 0 16px rgba(255,77,185,0.55)',
            }}
            className="portal-pulse"
          />
        </React.Fragment>
      ))}

      {entities.map((entity, idx) => (
        <div
          key={`entity-${idx}`}
          style={{
            ...getCellStyle(entity.position.x, entity.position.y),
            backgroundColor: getColorForEntity(entity.type),
            opacity: entity.type === 'gate' && !entity.active ? 0.35 : 1,
            border: '2px solid rgba(0,0,0,0.2)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.25)',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-[10px] font-black"
        >
          {entity.type === 'key' && 'K'}
          {entity.type === 'box' && 'B'}
          {entity.type === 'mine' && 'M'}
          {entity.type === 'shield' && 'S'}
          {entity.type === 'arrow' && <span style={{ transform: `rotate(${getArrowRotation(entity.direction)}deg)` }}>^</span>}
          {entity.type === 'gate' && (entity.active ? 'X' : 'O')}
        </div>
      ))}

      {apples.map((apple, idx) => (
        <div
          key={apple.id}
          style={{
            ...getCellStyle(apple.position.x, apple.position.y),
            opacity: isInLightRadius(apple.position.x, apple.position.y) ? 1 : 0.2,
            animationDelay: `${idx * 80}ms`,
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
          }}
          className="flex items-center justify-center"
        >
          <img src={FRUIT_ASSETS[apple.type]} alt={apple.type} className="h-full w-full object-contain apple-float" loading="eager" draggable={false} />
        </div>
      ))}

      {snake.body.map((segment, idx) => {
        const isHead = idx === 0;
        const opacity = isInLightRadius(segment.x, segment.y) ? 1 : 0.2;
        return (
          <div
            key={`snake-${idx}`}
            style={{
              ...getCellStyle(segment.x, segment.y),
              background: isHead ? 'linear-gradient(150deg, #4f8cff 0%, #2558c7 100%)' : 'linear-gradient(150deg, #4d7ee8 0%, #284fb0 100%)',
              border: isHead ? '2px solid rgba(22,54,130,0.9)' : '2px solid rgba(22,54,130,0.42)',
              borderRadius: Math.max(6, Math.floor(cellSize * 0.18)),
              opacity,
              transform: `${getTranslate(segment.x, segment.y)} ${isHead ? 'scale(1.06)' : 'scale(1)'}`,
              boxShadow: shieldActive && isHead
                ? '0 0 0 3px rgba(180,240,255,0.65),0 0 18px rgba(53,200,255,0.8)'
                : '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: isHead ? 20 : 10,
            }}
            className={isHead ? 'snake-head-breathe' : ''}
          >
            {isHead ? (
              <>
                <img
                  src={purcarAsset}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = HEAD_FALLBACK;
                  }}
                  alt="Snake Head"
                  className="w-full h-full object-cover rounded-full"
                  style={{ transform: `rotate(${getHeadRotation(snake.direction)}deg)` }}
                  draggable={false}
                />
                <div className="absolute inset-x-[18%] top-[10%] h-[18%] rounded-full bg-white/35" />
              </>
            ) : (
              <div className="absolute inset-x-[18%] top-[12%] h-[18%] rounded-full bg-white/20" />
            )}
          </div>
        );
      })}

      {secondSnake &&
        secondSnake.body.map((segment, idx) => {
          const isHead = idx === 0;
          return (
            <div
              key={`snake2-${idx}`}
              style={{
                ...getCellStyle(segment.x, segment.y),
                background: isHead ? 'linear-gradient(150deg, #f2c14e 0%, #d48f23 100%)' : 'linear-gradient(150deg, #efb743 0%, #c17a1c 100%)',
                border: '2px solid rgba(26,71,140,0.5)',
                borderRadius: Math.max(6, Math.floor(cellSize * 0.18)),
                transform: `${getTranslate(segment.x, segment.y)} ${isHead ? 'scale(1.05)' : 'scale(1)'}`,
                zIndex: isHead ? 18 : 9,
              }}
            >
              {isHead && (
                <img
                  src={purcarAsset}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = HEAD_FALLBACK;
                  }}
                  alt="Second Snake Head"
                  className="w-full h-full object-cover rounded-full opacity-85"
                  style={{ transform: `rotate(${getHeadRotation(secondSnake.direction)}deg)` }}
                  draggable={false}
                />
              )}
            </div>
          );
        })}

      {mode === 'light' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${snake.body[0].x * cellSize + cellSize / 2}px ${
              snake.body[0].y * cellSize + cellSize / 2
            }px, transparent 0%, transparent ${lightRadius * cellSize}px, rgba(0,0,0,0.86) ${lightRadius * cellSize + 38}px)`,
          }}
        />
      )}

      {mode === 'blender' && (
        <div className="absolute left-3 top-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30 bg-black/55 text-white">
          {blenderPhase}
        </div>
      )}
    </div>
  );
};

function getArrowRotation(direction?: Direction): number {
  switch (direction) {
    case 'UP':
      return 0;
    case 'RIGHT':
      return 90;
    case 'DOWN':
      return 180;
    case 'LEFT':
      return 270;
    default:
      return 0;
  }
}

function getHeadRotation(direction: Direction): number {
  switch (direction) {
    case 'UP':
      return 0;
    case 'RIGHT':
      return 90;
    case 'DOWN':
      return 180;
    case 'LEFT':
      return 270;
    default:
      return 0;
  }
}
