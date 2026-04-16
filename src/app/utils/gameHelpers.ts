// Game Helper Functions

import type { Position, Direction, MapSize, Speed, GameMode, Snake, Apple, GameEntity, Portal } from '../types/game';

// Map size configurations
export const MAP_SIZES: Record<MapSize, { width: number; height: number }> = {
  small: { width: 15, height: 15 },
  medium: { width: 20, height: 20 },
  large: { width: 25, height: 25 },
};

// Speed configurations (ms between moves)
export const SPEED_CONFIG: Record<Speed, number> = {
  slow: 150,
  normal: 100,
  fast: 70,
};

// Direction helpers
export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const getNextPosition = (pos: Position, direction: Direction): Position => {
  switch (direction) {
    case 'UP':
      return { x: pos.x, y: pos.y - 1 };
    case 'DOWN':
      return { x: pos.x, y: pos.y + 1 };
    case 'LEFT':
      return { x: pos.x - 1, y: pos.y };
    case 'RIGHT':
      return { x: pos.x + 1, y: pos.y };
  }
};

export const isPositionEqual = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

export const isOutOfBounds = (pos: Position, width: number, height: number): boolean => {
  return pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height;
};

export const wrapPosition = (pos: Position, width: number, height: number): Position => {
  return {
    x: (pos.x + width) % width,
    y: (pos.y + height) % height,
  };
};

export const isPositionInSnake = (pos: Position, snake: Snake): boolean => {
  return snake.body.some(segment => isPositionEqual(segment, pos));
};

export const isPositionOccupied = (
  pos: Position,
  snake: Snake,
  apples: Apple[],
  entities: GameEntity[],
  secondSnake?: Snake
): boolean => {
  if (isPositionInSnake(pos, snake)) return true;
  if (secondSnake && isPositionInSnake(pos, secondSnake)) return true;
  if (apples.some(apple => isPositionEqual(apple.position, pos))) return true;
  if (entities.some(entity => isPositionEqual(entity.position, pos))) return true;
  return false;
};

export const getRandomPosition = (
  width: number,
  height: number,
  snake: Snake,
  apples: Apple[],
  entities: GameEntity[],
  secondSnake?: Snake
): Position => {
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    const pos: Position = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    };

    if (!isPositionOccupied(pos, snake, apples, entities, secondSnake)) {
      return pos;
    }
    attempts++;
  }

  // Fallback: find first available position
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = { x, y };
      if (!isPositionOccupied(pos, snake, apples, entities, secondSnake)) {
        return pos;
      }
    }
  }

  // Last resort: return center
  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
};

export const initializeSnake = (width: number, height: number): Snake => {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  return {
    body: [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ],
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
  };
};

export const generateWalls = (width: number, height: number, count: number, snake: Snake): GameEntity[] => {
  const walls: GameEntity[] = [];
  const minDistance = 3; // Minimum distance from snake head

  for (let i = 0; i < count; i++) {
    let pos: Position;
    let attempts = 0;

    do {
      pos = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      };
      attempts++;
    } while (
      attempts < 100 &&
      (isPositionInSnake(pos, snake) ||
        walls.some(w => isPositionEqual(w.position, pos)) ||
        Math.abs(pos.x - snake.body[0].x) + Math.abs(pos.y - snake.body[0].y) < minDistance)
    );

    if (attempts < 100) {
      walls.push({ position: pos, type: 'wall' });
    }
  }

  return walls;
};

export const generatePortals = (width: number, height: number, count: number, snake: Snake): Portal[] => {
  const portals: Portal[] = [];

  for (let i = 0; i < count; i++) {
    let entrance: Position;
    let exit: Position;
    let attempts = 0;

    do {
      entrance = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      };
      exit = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      };
      attempts++;
    } while (
      attempts < 100 &&
      (isPositionInSnake(entrance, snake) ||
        isPositionInSnake(exit, snake) ||
        isPositionEqual(entrance, exit))
    );

    if (attempts < 100) {
      portals.push({ entrance, exit });
    }
  }

  return portals;
};

export const getManhattanDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

export const getLocalStorageHighScore = (mode: GameMode): number => {
  try {
    const scores = localStorage.getItem('snake-high-scores');
    if (scores) {
      const parsed = JSON.parse(scores);
      return parsed[mode] || 0;
    }
  } catch (e) {
    console.error('Error reading high scores:', e);
  }
  return 0;
};

export const setLocalStorageHighScore = (mode: GameMode, score: number): void => {
  try {
    const scores = localStorage.getItem('snake-high-scores');
    const parsed = scores ? JSON.parse(scores) : {};
    parsed[mode] = Math.max(parsed[mode] || 0, score);
    localStorage.setItem('snake-high-scores', JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving high score:', e);
  }
};

export const getColorForEntity = (type: GameEntity['type']): string => {
  switch (type) {
    case 'wall':
      return 'rgb(100, 100, 100)';
    case 'key':
      return 'rgb(255, 215, 0)';
    case 'box':
      return 'rgb(139, 69, 19)';
    case 'mine':
      return 'rgb(255, 0, 0)';
    case 'statue':
      return 'rgb(169, 169, 169)';
    case 'shield':
      return 'rgb(0, 191, 255)';
    case 'arrow':
      return 'rgb(255, 165, 0)';
    case 'gate':
      return 'rgb(128, 0, 128)';
  }
};

export const playSound = (type: 'eat' | 'gameover' | 'collect', enabled: boolean): void => {
  if (!enabled) return;
  
  // Simple beep sounds using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'eat':
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.value = 0.1;
        break;
      case 'collect':
        oscillator.frequency.value = 659.25; // E5
        gainNode.gain.value = 0.1;
        break;
      case 'gameover':
        oscillator.frequency.value = 220; // A3
        gainNode.gain.value = 0.15;
        break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Audio not supported or blocked
  }
};
