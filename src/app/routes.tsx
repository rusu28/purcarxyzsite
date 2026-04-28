// Routes Configuration

import { createBrowserRouter } from 'react-router';
import { Landing } from './pages/Landing';
import { Menu } from './pages/Menu';
import { Settings } from './pages/Settings';
import { Game } from './pages/Game';
import { HighScores } from './pages/HighScores';
import { FlappyBird } from './pages/FlappyBird';
import { Dino } from './pages/Dino';
import { RetroArcade } from './pages/RetroArcade';
import { RetroArcadePlayer } from './pages/RetroArcadePlayer';
import { Alpha } from './pages/Alpha';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/menu',
    element: <Menu />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/game',
    element: <Game />,
  },
  {
    path: '/high-scores',
    element: <HighScores />,
  },
  {
    path: '/flappy',
    element: <FlappyBird />,
  },
  {
    path: '/dino',
    element: <Dino />,
  },
  {
    path: '/arcade',
    element: <RetroArcade />,
  },
  {
    path: '/arcade/:source/:slug',
    element: <RetroArcadePlayer />,
  },
  {
    path: '/alpha',
    element: <Alpha />,
  },
  {
    path: '*',
    element: <Landing />,
  },
]);
