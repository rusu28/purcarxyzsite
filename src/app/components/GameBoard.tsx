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
  const { mode, theme } = settings;

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
  const maxBoardWidth = isMobile ? viewport.width - 8 : viewport.width - 28;
  const maxBoardHeight = isMobile ? viewport.height - 250 : viewport.height - 110;
  const cellSize = Math.max(16, Math.min(64, Math.floor(Math.min(maxBoardWidth / width, maxBoardHeight / height))));
  const boardWidth = width * cellSize;
  const boardHeight = height * cellSize;

  const getCellStyle = (x: number, y: number): React.CSSProperties => ({
    position: 'absolute',
    left: x * cellSize,
    top: y * cellSize,
    width: cellSize,
    height: cellSize,
    borderRadius: Math.max(4, Math.floor(cellSize * 0.28)),
    transitionProperty: 'left, top, transform, opacity',
    transitionDuration: '120ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    willChange: 'left, top',
  });

  const isInLightRadius = (x: number, y: number): boolean => {
    if (mode !== 'light') return true;
    const head = snake.body[0];
    return Math.abs(head.x - x) + Math.abs(head.y - y) <= lightRadius;
  };

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-[2rem] border-[6px] ${
        theme === 'dark'
          ? 'border-[#3a3f50] bg-[#171a24] shadow-[0_10px_0_0_#0f1119,0_24px_50px_rgba(0,0,0,0.35)]'
          : 'border-[#f0c89f] bg-[#fffdf9] shadow-[0_10px_0_0_#eabf94,0_24px_50px_rgba(68,41,0,0.25)]'
      }`}
      style={{ width: boardWidth, height: boardHeight }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === 'dark'
              ? 'linear-gradient(180deg, #1f2330 0%, #161925 100%)'
              : 'linear-gradient(180deg, #fffdf9 0%, #fff4e7 100%)',
        }}
      />

      {Array.from({ length: height }).map((_, y) =>
        Array.from({ length: width }).map((__, x) => (
          <div
            key={`grid-${x}-${y}`}
            className="absolute"
            style={{
              left: x * cellSize,
              top: y * cellSize,
              width: cellSize,
              height: cellSize,
              backgroundColor:
                (x + y) % 2 === 0
                  ? theme === 'dark'
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,153,41,0.06)'
                  : 'transparent',
              opacity: isInLightRadius(x, y) ? 1 : 0.08,
            }}
          />
        ))
      )}

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
            borderRadius: '12px',
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
          className="flex items-center justify-center apple-float"
        >
          <img src={FRUIT_ASSETS[apple.type]} alt={apple.type} className="w-full h-full object-contain" loading="eager" draggable={false} />
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
              background: isHead ? 'linear-gradient(150deg, #5af08a 0%, #1ab75e 100%)' : 'linear-gradient(150deg, #47df7a 0%, #14934b 100%)',
              border: isHead ? '2px solid rgba(0,90,36,0.8)' : '2px solid rgba(0,90,36,0.35)',
              borderRadius: '9999px',
              opacity,
              transform: isHead ? 'scale(1.06)' : 'scale(1)',
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
                <div className="absolute inset-x-[24%] top-[10%] h-[18%] rounded-full bg-white/35" />
              </>
            ) : (
              <div className="absolute inset-x-[20%] top-[12%] h-[20%] rounded-full bg-white/22" />
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
                background: isHead ? 'linear-gradient(150deg, #8bc5ff 0%, #387dde 100%)' : 'linear-gradient(150deg, #76b8ff 0%, #2f6fce 100%)',
                border: '2px solid rgba(26,71,140,0.5)',
                borderRadius: '9999px',
                transform: isHead ? 'scale(1.05)' : 'scale(1)',
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
