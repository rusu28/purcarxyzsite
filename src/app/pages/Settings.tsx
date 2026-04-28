import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Gamepad2, Home, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { LaunchTimer } from '../components/LaunchTimer';
import type { GameSettings, MapSize, PurcarAvatarMode, Speed, Theme } from '../types/game';
import { applyThemeClass, loadStoredSettings, PURCAR_ASSETS, resolvePurcarAvatar, saveStoredSettings } from '../utils/settings';

const speedOptions: Array<{ value: Speed; label: string }> = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

const mapOptions: Array<{ value: MapSize; label: string }> = [
  { value: 'small', label: '15x15' },
  { value: 'medium', label: '20x20' },
  { value: 'large', label: '25x25' },
];

const themeOptions: Array<{ value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const avatarOptions: Array<{ value: PurcarAvatarMode; label: string; src: string }> = [
  { value: 'auto', label: 'Auto', src: PURCAR_ASSETS.purcar1 },
  { value: 'purcar1', label: 'P1', src: PURCAR_ASSETS.purcar1 },
  { value: 'purcar2', label: 'P2', src: PURCAR_ASSETS.purcar2 },
  { value: 'purcar3', label: 'P3', src: PURCAR_ASSETS.purcar3 },
  { value: 'purcar4', label: 'P4', src: PURCAR_ASSETS.purcar4 },
  { value: 'purcar5', label: 'P5', src: PURCAR_ASSETS.purcar5 },
  { value: 'purcar6', label: 'P6', src: PURCAR_ASSETS.purcar6 },
];

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Omit<GameSettings, 'mode'>>(() => loadStoredSettings());

  useEffect(() => {
    saveStoredSettings(settings);
    applyThemeClass(settings.theme);
  }, [settings]);

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const activeAvatar = resolvePurcarAvatar(settings.purcarAvatar, Date.now());

  return (
    <main className="min-h-screen bg-[#101214] text-white">
      <LaunchTimer />

      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#101214]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:gap-3 sm:px-6 sm:py-0 lg:px-8">
          <Button variant="outline" onClick={() => navigate('/menu')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
            <ArrowLeft className="h-4 w-4" />
            Menu
          </Button>
          <div className="hidden items-center gap-2 text-sm font-black uppercase tracking-[0.18em] sm:flex">
            <Gamepad2 className="h-5 w-5 text-[#f2c14e]" />
            Settings
          </div>
          <Button variant="ghost" onClick={() => navigate('/')} className="h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <img src="/assets/backgroundlandingpage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" draggable={false} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#101214_0%,rgba(16,18,20,0.94)_50%,rgba(16,18,20,0.78)_100%)]" />
        <div className="absolute inset-0 qual-flow-grid opacity-35" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="qual-reveal text-sm font-black uppercase tracking-[0.2em] text-[#83e377]">Control panel</p>
            <h1 className="qual-reveal qual-reveal-delay-1 mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Game Settings
            </h1>
            <p className="qual-reveal qual-reveal-delay-2 mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Speed, board size, theme, audio, and avatar settings save automatically.
            </p>
          </div>

          <div className="qual-panel qual-reveal qual-reveal-delay-3 rounded-lg border border-white/10 bg-black/30 p-5">
            <img src={activeAvatar} alt="" className="h-28 w-28 rounded-lg border border-white/20 object-cover" draggable={false} />
            <h2 className="mt-5 text-2xl font-black">Active Purcar</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">Snake head, arcade badge and embedded-game overlay use this skin.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          <SettingsPanel title="Game Feel">
            <SegmentedControl value={settings.speed} options={speedOptions} onChange={value => updateSetting('speed', value)} />

            <div className="space-y-3">
              <Label htmlFor="appleCount" className="text-white">Apple Count: {settings.appleCount}</Label>
              <Slider
                id="appleCount"
                min={1}
                max={5}
                step={1}
                value={[settings.appleCount]}
                onValueChange={value => updateSetting('appleCount', value[0])}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="h-5 w-5 text-[#83e377]" /> : <VolumeX className="h-5 w-5 text-white/40" />}
                <Label htmlFor="sound" className="text-white">Sound Effects</Label>
              </div>
              <Switch id="sound" checked={settings.soundEnabled} onCheckedChange={checked => updateSetting('soundEnabled', checked)} />
            </div>
          </SettingsPanel>

          <SettingsPanel title="Board">
            <SegmentedControl value={settings.mapSize} options={mapOptions} onChange={value => updateSetting('mapSize', value)} />
            <SegmentedControl
              value={settings.theme}
              options={themeOptions.map(option => ({ value: option.value, label: option.label, icon: option.icon }))}
              onChange={value => updateSetting('theme', value)}
            />

            <div className="space-y-3">
              <Label htmlFor="purcarDashCubeScale" className="text-white">
                Purcar Dash Cube Size: {settings.purcarDashCubeScale.toFixed(2)}x
              </Label>
              <Slider
                id="purcarDashCubeScale"
                min={0.5}
                max={6}
                step={0.05}
                value={[settings.purcarDashCubeScale]}
                onValueChange={value => updateSetting('purcarDashCubeScale', value[0])}
              />
            </div>
          </SettingsPanel>

          <SettingsPanel title="Purcar Avatar" className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
              {avatarOptions.map(option => {
                const isActive = settings.purcarAvatar === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateSetting('purcarAvatar', option.value)}
                    className={`rounded-lg border p-2 text-center transition-colors ${
                      isActive ? 'border-[#f2c14e] bg-[#f2c14e] text-[#11100f]' : 'border-white/10 bg-black/20 text-white hover:border-white/25'
                    }`}
                  >
                    <img src={option.src} alt="" className="mx-auto h-16 w-16 rounded-lg object-cover" draggable={false} />
                    <div className="mt-2 text-xs font-black uppercase tracking-[0.12em]">{option.label}</div>
                  </button>
                );
              })}
            </div>
          </SettingsPanel>
        </div>
      </section>
    </main>
  );
};

const SettingsPanel: React.FC<{ title: string; className?: string; children: React.ReactNode }> = ({ title, className = '', children }) => (
  <section className={`qual-panel rounded-lg border border-white/10 bg-[#171a1d] p-5 ${className}`}>
    <h2 className="mb-5 text-xl font-black">{title}</h2>
    <div className="grid gap-5">{children}</div>
  </section>
);

const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  onChange: (value: T) => void;
}) => (
  <div className="grid gap-2 sm:grid-cols-3">
    {options.map(option => {
      const Icon = option.icon;
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition-colors ${
            isActive ? 'border-[#f2c14e] bg-[#f2c14e] text-[#11100f]' : 'border-white/10 bg-black/20 text-white hover:border-white/25'
          }`}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {option.label}
        </button>
      );
    })}
  </div>
);
