export type ArcadeSource = 'retro' | 'supermario';

export type ArcadeGame = {
  slug: string;
  title: string;
  source: ArcadeSource;
  year?: number;
};

export const RETRO_GAMES: ArcadeGame[] = [
  { slug: 'computer-space', title: 'Computer Space', year: 1971, source: 'retro' },
  { slug: 'pong', title: 'Pong', year: 1972, source: 'retro' },
  { slug: 'gun-fight', title: 'Gun Fight', year: 1975, source: 'retro' },
  { slug: 'breakout', title: 'Breakout', year: 1976, source: 'retro' },
  { slug: 'space-invaders', title: 'Space Invaders', year: 1978, source: 'retro' },
  { slug: 'galaxian', title: 'Galaxian', year: 1979, source: 'retro' },
  { slug: 'asteroids', title: 'Asteroids', year: 1979, source: 'retro' },
  { slug: 'lunar-lander', title: 'Lunar Lander', year: 1979, source: 'retro' },
  { slug: 'pac-man', title: 'Pac-Man', year: 1980, source: 'retro' },
  { slug: 'centipede', title: 'Centipede', year: 1980, source: 'retro' },
  { slug: 'missile-command', title: 'Missile Command', year: 1980, source: 'retro' },
  { slug: 'defender', title: 'Defender', year: 1981, source: 'retro' },
];

export const SUPERMARIO_GAMES: ArcadeGame[] = [
  { slug: '01-Candy-Crush-Game', title: 'Candy Crush', source: 'supermario' },
  { slug: '02-Pac-Man-Game', title: 'Pac-Man', source: 'supermario' },
  { slug: '03-Chess-Game', title: 'Chess', source: 'supermario' },
  { slug: '04-Doodle-Jump-Game', title: 'Doodle Jump', source: 'supermario' },
  { slug: '05-Solitaire-Game', title: 'Solitaire', source: 'supermario' },
  { slug: '06-Sudoku-Game', title: 'Sudoku', source: 'supermario' },
  { slug: '07-Crossy-Road-Game', title: 'Crossy Road', source: 'supermario' },
  { slug: '08-Rock-Paper-Scissors', title: 'Rock Paper Scissors', source: 'supermario' },
  { slug: '09-Flappy-Bird-Game', title: 'Flappy Bird', source: 'supermario' },
  { slug: '10-2048-Game', title: '2048', source: 'supermario' },
  { slug: '11-Wordle-Game', title: 'Wordle', source: 'supermario' },
  { slug: '12-Hangman-Game', title: 'Hangman', source: 'supermario' },
  { slug: '13-Tower-Blocks', title: 'Tower Blocks', source: 'supermario' },
  { slug: '14-Archery-Game', title: 'Archery', source: 'supermario' },
  { slug: '15-Tic-Tac-Toe', title: 'Tic Tac Toe', source: 'supermario' },
  { slug: '16-Minesweeper-Game', title: 'Minesweeper', source: 'supermario' },
  { slug: '17-Speed-Typing-Game', title: 'Speed Typing', source: 'supermario' },
  { slug: '18-Breakout-Game', title: 'Breakout', source: 'supermario' },
  { slug: '19-Ping-Pong-Game', title: 'Ping Pong', source: 'supermario' },
  { slug: '20-Tetris-Game', title: 'Tetris', source: 'supermario' },
  { slug: '21-Tilting-Maze-Game', title: 'Tilting Maze', source: 'supermario' },
  { slug: '22-Memory-Card-Game', title: 'Memory Card', source: 'supermario' },
  { slug: '23-Type-Number-Guessing-Game', title: 'Type Number Guessing', source: 'supermario' },
  { slug: '24-Snake-Game', title: 'Snake', source: 'supermario' },
  { slug: '25-Connect-Four-Game', title: 'Connect Four', source: 'supermario' },
  { slug: '26-Insect-Catch-Game', title: 'Insect Catch', source: 'supermario' },
  { slug: '27-Typing-Game', title: 'Typing', source: 'supermario' },
  { slug: '28-Dice-Roll-Simulator', title: 'Dice Roll Simulator', source: 'supermario' },
  { slug: '29-Shape-Clicker-Game', title: 'Shape Clicker', source: 'supermario' },
  { slug: '30-Typing-Game', title: 'Typing Pro', source: 'supermario' },
  { slug: '31-Speak-Number-Guessing-Game', title: 'Speak Number Guessing', source: 'supermario' },
  { slug: '32-Fruit-Slicer-Game', title: 'Fruit Slicer', source: 'supermario' },
  { slug: '33-Quiz-Game', title: 'Quiz', source: 'supermario' },
  { slug: '34-Emoji-Catcher-Game', title: 'Emoji Catcher', source: 'supermario' },
  { slug: '35-Whack-A-Mole-Game', title: 'Whack A Mole', source: 'supermario' },
  { slug: '36-Simon-Says-Game', title: 'Simon Says', source: 'supermario' },
  { slug: '37-Sliding-Puzzle-Game', title: 'Sliding Puzzle', source: 'supermario' },
];

export const ARCADE_GAMES: ArcadeGame[] = [...RETRO_GAMES, ...SUPERMARIO_GAMES];
export const ARCADE_GAME_MAP = Object.fromEntries(ARCADE_GAMES.map(game => [`${game.source}:${game.slug}`, game]));

export const getArcadeGameSrc = (game: ArcadeGame) =>
  game.source === 'retro'
    ? `/browser-games-main/${game.slug}/index.html`
    : `/supermario/html-css-javascript-games-main/${game.slug}/index.html`;
