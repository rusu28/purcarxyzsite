import type { GameSettings, MapSize, PurcarAvatarMode, Speed, Theme } from '../types/game';

export type StoredSettings = Omit<GameSettings, 'mode'>;

export const DEFAULT_STORED_SETTINGS: StoredSettings = {
  speed: 'normal' as Speed,
  appleCount: 1,
  mapSize: 'medium' as MapSize,
  theme: 'light' as Theme,
  soundEnabled: true,
  purcarAvatar: 'auto' as PurcarAvatarMode,
  purcarDashCubeScale: 1,
};

export const PURCAR_ASSETS = {
  purcar1: '/assets/snake/head.png',
  purcar2: '/assets/snake/purcar2.jpeg',
  purcar3: '/assets/snake/purcar3.jpeg',
  purcar4: '/assets/snake/purcar4.jpeg',
  purcar5: '/assets/snake/purcar5.jpeg',
  purcar6: '/assets/snake/purcar6.jpeg',
} as const;

const PURCAR_KEYS = ['purcar1', 'purcar2', 'purcar3', 'purcar4', 'purcar5', 'purcar6'] as const;

export const resolvePurcarAvatar = (mode: PurcarAvatarMode, seed = Date.now()): string => {
  if (mode !== 'auto') return PURCAR_ASSETS[mode];
  const index = Math.abs(seed) % PURCAR_KEYS.length;
  return PURCAR_ASSETS[PURCAR_KEYS[index]];
};

export const applyThemeClass = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const loadStoredSettings = (): StoredSettings => {
  if (typeof localStorage === 'undefined') return DEFAULT_STORED_SETTINGS;
  try {
    const raw = localStorage.getItem('snake-settings');
    if (!raw) return DEFAULT_STORED_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    const rawScale = parsed.purcarDashCubeScale;
    const legacySize = (parsed as Partial<{ purcarDashCubeSize: 'normal' | 'large' | 'xl' }>).purcarDashCubeSize;
    const legacyScale = legacySize === 'large' ? 1.35 : legacySize === 'xl' ? 1.8 : 1;
    const parsedScale = typeof rawScale === 'number' && Number.isFinite(rawScale) ? rawScale : legacyScale;

    return {
      speed: parsed.speed ?? DEFAULT_STORED_SETTINGS.speed,
      appleCount: parsed.appleCount ?? DEFAULT_STORED_SETTINGS.appleCount,
      mapSize: parsed.mapSize ?? DEFAULT_STORED_SETTINGS.mapSize,
      theme: parsed.theme ?? DEFAULT_STORED_SETTINGS.theme,
      soundEnabled: parsed.soundEnabled ?? DEFAULT_STORED_SETTINGS.soundEnabled,
      purcarAvatar: parsed.purcarAvatar ?? DEFAULT_STORED_SETTINGS.purcarAvatar,
      purcarDashCubeScale: Math.max(0.5, Math.min(6, parsedScale)),
    };
  } catch {
    return DEFAULT_STORED_SETTINGS;
  }
};

export const saveStoredSettings = (settings: StoredSettings) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('snake-settings', JSON.stringify(settings));
  localStorage.setItem('purcarDashCubeScale', String(settings.purcarDashCubeScale));
};
