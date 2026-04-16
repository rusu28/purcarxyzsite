import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSettings, GameData, Direction, Snake, Apple, GameEntity, Position } from '../types/game';
import {
  MAP_SIZES,
  SPEED_CONFIG,
  OPPOSITE_DIRECTIONS,
  getNextPosition,
  isPositionEqual,
  isOutOfBounds,
  wrapPosition,
  isPositionInSnake,
  getRandomPosition,
  initializeSnake,
  generateWalls,
  generatePortals,
  getManhattanDistance,
  getLocalStorageHighScore,
  setLocalStorageHighScore,
  playSound,
} from '../utils/gameHelpers';

const BLENDER_PHASES: Array<GameData['blenderPhase']> = ['calm', 'warp', 'chaos'];

export const useGameLogic = (settings: GameSettings) => {
  const { mode, speed, appleCount, mapSize } = settings;
  const { width, height } = MAP_SIZES[mapSize];

  const [gameData, setGameData] = useState<GameData>(() => initializeGame());
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shieldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function initializeGame(): GameData {
    const snake = initializeSnake(width, height);
    const entities: GameEntity[] = [];
    const portals = mode === 'portal' || mode === 'blender' ? generatePortals(width, height, 3, snake) : [];

    if (mode === 'wall' || mode === 'blender') {
      entities.push(...generateWalls(width, height, 10, snake));
    } else if (mode === 'statue') {
      entities.push(...generateWalls(width, height, 8, snake).map(w => ({ ...w, type: 'statue' as const })));
    } else if (mode === 'key') {
      entities.push({ position: getRandomPosition(width, height, snake, [], entities), type: 'key' });
    } else if (mode === 'sokoban') {
      for (let i = 0; i < 5; i++) entities.push({ position: getRandomPosition(width, height, snake, [], entities), type: 'box' });
    } else if (mode === 'minesweeper') {
      for (let i = 0; i < 15; i++) entities.push({ position: getRandomPosition(width, height, snake, [], entities), type: 'mine' });
    } else if (mode === 'shield') {
      for (let i = 0; i < 3; i++) entities.push({ position: getRandomPosition(width, height, snake, [], entities), type: 'shield' });
    } else if (mode === 'arrow') {
      for (let i = 0; i < 8; i++) {
        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        entities.push({
          position: getRandomPosition(width, height, snake, [], entities),
          type: 'arrow',
          direction: directions[Math.floor(Math.random() * directions.length)],
        });
      }
    } else if (mode === 'gate') {
      for (let i = 0; i < 6; i++) {
        entities.push({ position: getRandomPosition(width, height, snake, [], entities), type: 'gate', active: i % 2 === 0 });
      }
    }

    const apples: Apple[] = [];
    const appleCountToGenerate = mode === 'cheese' ? 5 : appleCount;

    for (let i = 0; i < appleCountToGenerate; i++) {
      apples.push({
        position: getRandomPosition(width, height, snake, apples, entities),
        type: mode === 'poison' && Math.random() > 0.5 ? 'poison' : mode === 'cheese' ? 'cheese' : 'normal',
        id: `apple-${i}`,
      });
    }

    let secondSnake: Snake | undefined;
    if (mode === 'twin') {
      secondSnake = {
        body: [
          { x: Math.floor(width / 4), y: Math.floor(height / 2) },
          { x: Math.floor(width / 4) - 1, y: Math.floor(height / 2) },
        ],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
      };
    }

    return {
      snake,
      secondSnake,
      apples,
      entities,
      portals,
      score: 0,
      highScore: getLocalStorageHighScore(mode),
      gameState: 'playing',
      hasKey: mode !== 'key',
      shieldActive: false,
      lightRadius: mode === 'light' ? 4 : 100,
      cheeseSequence: 0,
      dimension: 1,
      level: 1,
      streak: 0,
      blenderPhase: 'calm',
      ticks: 0,
    };
  }

  const resetGame = useCallback(() => {
    if (shieldTimeoutRef.current) {
      clearTimeout(shieldTimeoutRef.current);
      shieldTimeoutRef.current = null;
    }
    setGameData(initializeGame());
    setIsPaused(false);
  }, [mode, mapSize, appleCount]);

  const changeDirection = useCallback((newDirection: Direction) => {
    setGameData(prev => {
      if (OPPOSITE_DIRECTIONS[prev.snake.direction] === newDirection) return prev;
      return {
        ...prev,
        snake: { ...prev.snake, nextDirection: newDirection },
        secondSnake: prev.secondSnake ? { ...prev.secondSnake, nextDirection: newDirection } : undefined,
      };
    });
  }, []);

  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

  const isDeadBySelfCollision = (snake: Snake, newHead: Position) =>
    snake.body.slice(1).some(segment => isPositionEqual(segment, newHead));

  const getRandomBlenderPhase = (): GameData['blenderPhase'] =>
    BLENDER_PHASES[Math.floor(Math.random() * BLENDER_PHASES.length)];

  const moveSnake = useCallback(
    (currentData: GameData): GameData => {
      if (currentData.gameState !== 'playing') return currentData;

      let {
        snake,
        secondSnake,
        apples,
        entities,
        portals,
        score,
        hasKey,
        shieldActive,
        lightRadius,
        cheeseSequence,
        dimension,
        level,
        streak,
        blenderPhase,
        ticks,
      } = currentData;

      ticks += 1;
      if (mode === 'blender' && ticks % 20 === 0) blenderPhase = getRandomBlenderPhase();

      if ((mode === 'gate' || mode === 'blender') && ticks % 14 === 0) {
        entities = entities.map(entity => (entity.type === 'gate' ? { ...entity, active: !entity.active } : entity));
      }

      if ((mode === 'minesweeper' || mode === 'blender') && ticks % 9 === 0) {
        entities = entities.map(entity => {
          if (entity.type !== 'mine' || Math.random() > 0.22) return entity;
          const candidate = getNextPosition(entity.position, ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)] as Direction);
          if (
            isOutOfBounds(candidate, width, height) ||
            isPositionInSnake(candidate, snake) ||
            (secondSnake && isPositionInSnake(candidate, secondSnake)) ||
            entities.some(other => other !== entity && isPositionEqual(other.position, candidate))
          ) {
            return entity;
          }
          return { ...entity, position: candidate };
        });
      }

      snake = { ...snake, direction: snake.nextDirection };
      const effectiveBorderless = mode === 'borderless' || (mode === 'blender' && blenderPhase === 'warp');
      let newHead = getNextPosition(snake.body[0], snake.direction);

      if (effectiveBorderless) {
        newHead = wrapPosition(newHead, width, height);
      }

      if ((mode === 'portal' || mode === 'blender') && portals.length > 0) {
        const hitPortal = portals.find(portal => isPositionEqual(newHead, portal.entrance));
        if (hitPortal) {
          newHead = { ...hitPortal.exit };
          playSound('collect', settings.soundEnabled);
        }
      }

      if (!effectiveBorderless && mode !== 'peaceful' && isOutOfBounds(newHead, width, height)) {
        playSound('gameover', settings.soundEnabled);
        return { ...currentData, gameState: 'gameover' };
      }

      const collidedEntity = entities.find(entity => isPositionEqual(entity.position, newHead));
      if (collidedEntity) {
        if (collidedEntity.type === 'wall' || collidedEntity.type === 'statue') {
          if (mode === 'winged') {
            newHead = getNextPosition(newHead, snake.direction);
          } else if (mode !== 'peaceful' && !shieldActive) {
            playSound('gameover', settings.soundEnabled);
            return { ...currentData, gameState: 'gameover' };
          }
        } else if (collidedEntity.type === 'key') {
          hasKey = true;
          entities = entities.filter(e => e !== collidedEntity);
          playSound('collect', settings.soundEnabled);
        } else if (collidedEntity.type === 'shield') {
          shieldActive = true;
          entities = entities.filter(e => e !== collidedEntity);
          playSound('collect', settings.soundEnabled);
          if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);
          shieldTimeoutRef.current = setTimeout(() => {
            setGameData(prev => ({ ...prev, shieldActive: false }));
          }, 3500);
        } else if (collidedEntity.type === 'arrow' && collidedEntity.direction) {
          snake = { ...snake, direction: collidedEntity.direction, nextDirection: collidedEntity.direction };
        } else if ((collidedEntity.type === 'mine' || (collidedEntity.type === 'gate' && collidedEntity.active)) && mode !== 'peaceful' && !shieldActive) {
          playSound('gameover', settings.soundEnabled);
          return { ...currentData, gameState: 'gameover' };
        } else if (collidedEntity.type === 'box' && mode === 'sokoban') {
          const boxNewPos = getNextPosition(collidedEntity.position, snake.direction);
          const boxBlocked =
            isOutOfBounds(boxNewPos, width, height) ||
            entities.some(entity => entity !== collidedEntity && isPositionEqual(entity.position, boxNewPos));
          if (boxBlocked) return currentData;
          entities = entities.map(entity => (entity === collidedEntity ? { ...entity, position: boxNewPos } : entity));
        }
      }

      if (!effectiveBorderless && mode !== 'peaceful' && isOutOfBounds(newHead, width, height)) {
        playSound('gameover', settings.soundEnabled);
        return { ...currentData, gameState: 'gameover' };
      }

      if (mode !== 'peaceful' && !shieldActive && isDeadBySelfCollision(snake, newHead)) {
        playSound('gameover', settings.soundEnabled);
        return { ...currentData, gameState: 'gameover' };
      }

      let shouldGrow = false;
      let scoreIncrease = 0;
      const getAppleValue = (apple: Apple) => {
        const base = apple.type === 'golden' ? 50 : 10;
        const multiplier = 1 + Math.floor(streak / 4) * 0.25;
        return Math.round(base * multiplier);
      };

      const consumeApple = (apple: Apple): boolean => {
        if (mode === 'key' && !hasKey) return false;
        if (mode === 'cheese') {
          if (cheeseSequence !== Number(apple.id.split('-')[1])) return false;
          shouldGrow = true;
          scoreIncrease += getAppleValue(apple);
          cheeseSequence += 1;
          apples = apples.filter(item => item !== apple);
          playSound('eat', settings.soundEnabled);
          return true;
        }
        if (apple.type === 'poison' && mode === 'poison' && !shieldActive && mode !== 'peaceful') {
          playSound('gameover', settings.soundEnabled);
          return false;
        }
        shouldGrow = mode !== 'hotdog' || Math.random() > 0.4;
        scoreIncrease += getAppleValue(apple);
        if (mode === 'dimension') dimension = (dimension % 3) + 1;
        apples = apples.filter(item => item !== apple);
        playSound('eat', settings.soundEnabled);
        return true;
      };

      const eatenByMain = apples.find(apple => isPositionEqual(apple.position, newHead));
      if (eatenByMain) {
        const consumed = consumeApple(eatenByMain);
        if (mode === 'poison' && eatenByMain.type === 'poison' && !consumed && mode !== 'peaceful') {
          return { ...currentData, gameState: 'gameover' };
        }
      }

      let secondNewHead: Position | undefined;
      if (secondSnake) {
        secondSnake = { ...secondSnake, direction: secondSnake.nextDirection };
        secondNewHead = getNextPosition(secondSnake.body[0], secondSnake.direction);
        if (effectiveBorderless) secondNewHead = wrapPosition(secondNewHead, width, height);

        if (!effectiveBorderless && mode !== 'peaceful' && isOutOfBounds(secondNewHead, width, height)) {
          playSound('gameover', settings.soundEnabled);
          return { ...currentData, gameState: 'gameover' };
        }

        if (mode !== 'peaceful' && !shieldActive) {
          const hitItself = isDeadBySelfCollision(secondSnake, secondNewHead);
          const hitMainBody = snake.body.some(segment => isPositionEqual(segment, secondNewHead));
          if (hitItself || hitMainBody) {
            playSound('gameover', settings.soundEnabled);
            return { ...currentData, gameState: 'gameover' };
          }
        }

        const eatenBySecond = apples.find(apple => isPositionEqual(apple.position, secondNewHead));
        if (eatenBySecond) consumeApple(eatenBySecond);
      }

      if (mode === 'magnet' || (mode === 'blender' && blenderPhase === 'chaos')) {
        apples = apples.map(apple => {
          if (getManhattanDistance(apple.position, snake.body[0]) >= 5) return apple;
          const dx = Math.sign(snake.body[0].x - apple.position.x);
          const dy = Math.sign(snake.body[0].y - apple.position.y);
          const candidate = { x: apple.position.x + (Math.random() > 0.5 ? dx : 0), y: apple.position.y + (Math.random() > 0.5 ? dy : 0) };
          if (!isOutOfBounds(candidate, width, height) && !isPositionInSnake(candidate, snake)) {
            return { ...apple, position: candidate };
          }
          return apple;
        });
      }

      const targetAppleCount = mode === 'cheese' ? 5 : appleCount;
      while (apples.length < targetAppleCount) {
        const nextType: Apple['type'] =
          mode === 'poison' && Math.random() > 0.5
            ? 'poison'
            : Math.random() < Math.min(0.12 + level * 0.01, 0.35)
            ? 'golden'
            : mode === 'cheese'
            ? 'cheese'
            : 'normal';

        apples.push({
          position: getRandomPosition(width, height, snake, apples, entities, secondSnake),
          type: nextType,
          id: `apple-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        });
      }

      const newBody = [newHead, ...snake.body];
      if (!shouldGrow) newBody.pop();
      if (mode === 'dimension') {
        while (newBody.length > 3 * dimension) newBody.pop();
      }
      snake = { ...snake, body: newBody };

      if (secondSnake && secondNewHead) {
        const newBodySecond = [secondNewHead, ...secondSnake.body];
        if (!shouldGrow) newBodySecond.pop();
        secondSnake = { ...secondSnake, body: newBodySecond };
      }

      if (scoreIncrease > 0) {
        streak += 1;
      } else if (streak > 0 && ticks % 3 === 0) {
        streak -= 1;
      }

      score += scoreIncrease;
      level = Math.max(1, 1 + Math.floor(score / 80));

      if ((mode === 'wall' || mode === 'blender') && level > 1 && ticks % 24 === 0 && entities.filter(e => e.type === 'wall').length < 22) {
        entities = [...entities, { type: 'wall', position: getRandomPosition(width, height, snake, apples, entities, secondSnake) }];
      }

      const newHighScore = Math.max(currentData.highScore, score);
      if (newHighScore > currentData.highScore) setLocalStorageHighScore(mode, newHighScore);

      return {
        ...currentData,
        snake,
        secondSnake,
        apples,
        entities,
        score,
        highScore: newHighScore,
        hasKey,
        shieldActive,
        lightRadius,
        cheeseSequence,
        dimension,
        level,
        streak,
        blenderPhase,
        ticks,
      };
    },
    [mode, width, height, appleCount, settings.soundEnabled]
  );

  useEffect(() => {
    if (isPaused || gameData.gameState !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const dynamicInterval = Math.max(52, SPEED_CONFIG[speed] - (gameData.level - 1) * 2);
    gameLoopRef.current = setInterval(() => {
      setGameData(prev => moveSnake(prev));
    }, dynamicInterval);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPaused, gameData.gameState, gameData.level, speed, moveSnake]);

  useEffect(() => {
    return () => {
      if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);
    };
  }, []);

  return {
    gameData,
    isPaused,
    width,
    height,
    resetGame,
    changeDirection,
    togglePause,
  };
};
