export type RetroGame = {
  slug: string;
  title: string;
  year: number;
};

export const RETRO_GAMES: RetroGame[] = [
  { slug: 'computer-space', title: 'Computer Space', year: 1971 },
  { slug: 'pong', title: 'Pong', year: 1972 },
  { slug: 'gun-fight', title: 'Gun Fight', year: 1975 },
  { slug: 'breakout', title: 'Breakout', year: 1976 },
  { slug: 'space-invaders', title: 'Space Invaders', year: 1978 },
  { slug: 'galaxian', title: 'Galaxian', year: 1979 },
  { slug: 'asteroids', title: 'Asteroids', year: 1979 },
  { slug: 'lunar-lander', title: 'Lunar Lander', year: 1979 },
  { slug: 'pac-man', title: 'Pac-Man', year: 1980 },
  { slug: 'centipede', title: 'Centipede', year: 1980 },
  { slug: 'missile-command', title: 'Missile Command', year: 1980 },
  { slug: 'defender', title: 'Defender', year: 1981 },
];

export const RETRO_GAME_MAP = Object.fromEntries(RETRO_GAMES.map(game => [game.slug, game]));
