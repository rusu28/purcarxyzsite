// Game Types and Interfaces

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Position = {
  x: number;
  y: number;
};

export type GameMode = 
  | 'classic'
  | 'wall'
  | 'portal'
  | 'cheese'
  | 'borderless'
  | 'twin'
  | 'winged'
  | 'yinyang'
  | 'key'
  | 'sokoban'
  | 'poison'
  | 'dimension'
  | 'minesweeper'
  | 'statue'
  | 'light'
  | 'shield'
  | 'arrow'
  | 'hotdog'
  | 'magnet'
  | 'gate'
  | 'peaceful'
  | 'blender';

export type Speed = 'slow' | 'normal' | 'fast';

export type MapSize = 'small' | 'medium' | 'large';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export type Theme = 'light' | 'dark';
export type PurcarAvatarMode = 'auto' | 'purcar1' | 'purcar2' | 'purcar3' | 'purcar4' | 'purcar5' | 'purcar6';
export interface GameSettings {
  mode: GameMode;
  speed: Speed;
  appleCount: number;
  mapSize: MapSize;
  theme: Theme;
  soundEnabled: boolean;
  purcarAvatar: PurcarAvatarMode;
  purcarDashCubeScale: number;
}

export interface Snake {
  body: Position[];
  direction: Direction;
  nextDirection: Direction;
}

export interface Apple {
  position: Position;
  type: 'normal' | 'golden' | 'poison' | 'cheese';
  id: string;
}

export interface Portal {
  entrance: Position;
  exit: Position;
}

export interface GameEntity {
  position: Position;
  type: 'wall' | 'key' | 'box' | 'mine' | 'statue' | 'shield' | 'arrow' | 'gate';
  active?: boolean;
  direction?: Direction;
}

export interface GameData {
  snake: Snake;
  secondSnake?: Snake; // For twin mode
  apples: Apple[];
  entities: GameEntity[];
  portals: Portal[];
  score: number;
  highScore: number;
  gameState: GameState;
  hasKey: boolean;
  shieldActive: boolean;
  lightRadius: number;
  cheeseSequence: number;
  dimension: number; // For dimension mode
  level: number;
  streak: number;
  blenderPhase: 'calm' | 'warp' | 'chaos';
  ticks: number;
}

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  classic: 'Classic',
  wall: 'Wall',
  portal: 'Portal',
  cheese: 'Cheese',
  borderless: 'Borderless',
  twin: 'Twin',
  winged: 'Winged',
  yinyang: 'Yin Yang',
  key: 'Key',
  sokoban: 'Sokoban',
  poison: 'Poison',
  dimension: 'Dimension',
  minesweeper: 'Minesweeper',
  statue: 'Statue',
  light: 'Light',
  shield: 'Shield',
  arrow: 'Arrow',
  hotdog: 'Hotdog',
  magnet: 'Magnet',
  gate: 'Gate',
  peaceful: 'Peaceful',
  blender: 'Blender',
};

export const GAME_MODE_DESCRIPTIONS: Record<GameMode, string> = {
  classic: 'The original Snake game',
  wall: 'Navigate around random walls',
  portal: 'Teleport through portals',
  cheese: 'Collect cheese in sequence',
  borderless: 'No walls, wrap around edges',
  twin: 'Control two snakes at once',
  winged: 'Jump over obstacles with wings',
  yinyang: 'Two zones with different rules',
  key: 'Find the key to unlock apples',
  sokoban: 'Push boxes to reach apples',
  poison: 'Avoid poisoned apples',
  dimension: 'Shrink and grow the snake',
  minesweeper: 'Avoid hidden mines',
  statue: 'Navigate around statues',
  light: 'Limited visibility around snake',
  shield: 'Temporary invincibility shields',
  arrow: 'Follow direction arrows',
  hotdog: 'Special growth mechanics',
  magnet: 'Apples move toward you',
  gate: 'Open and close gates',
  peaceful: 'No game over, just fun',
  blender: 'Mix of all mechanics',
};
