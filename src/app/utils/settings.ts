import type { GameSettings, MapSize, Speed, Theme } from '../types/game';

export type StoredSettings = Omit<GameSettings, 'mode'>;

export const DEFAULT_STORED_SETTINGS: StoredSettings = {
  speed: 'normal' as Speed,
  appleCount: 1,
  mapSize: 'medium' as MapSize,
  theme: 'light' as Theme,
  soundEnabled: true,
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
    return {
      speed: parsed.speed ?? DEFAULT_STORED_SETTINGS.speed,
      appleCount: parsed.appleCount ?? DEFAULT_STORED_SETTINGS.appleCount,
      mapSize: parsed.mapSize ?? DEFAULT_STORED_SETTINGS.mapSize,
      theme: parsed.theme ?? DEFAULT_STORED_SETTINGS.theme,
      soundEnabled: parsed.soundEnabled ?? DEFAULT_STORED_SETTINGS.soundEnabled,
    };
  } catch {
    return DEFAULT_STORED_SETTINGS;
  }
};

export const saveStoredSettings = (settings: StoredSettings) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('snake-settings', JSON.stringify(settings));
};
