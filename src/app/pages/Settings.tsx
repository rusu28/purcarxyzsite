import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import type { GameSettings, Speed, MapSize, Theme } from '../types/game';
import { applyThemeClass, loadStoredSettings, saveStoredSettings } from '../utils/settings';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-100 to-neutral-300 dark:from-neutral-900 dark:to-black">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/menu')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-4xl font-black text-black dark:text-white">Settings</h1>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="speed">Game Speed</Label>
            <Select value={settings.speed} onValueChange={value => updateSetting('speed', value as Speed)}>
              <SelectTrigger id="speed"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapSize">Map Size</Label>
            <Select value={settings.mapSize} onValueChange={value => updateSetting('mapSize', value as MapSize)}>
              <SelectTrigger id="mapSize"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (15x15)</SelectItem>
                <SelectItem value="medium">Medium (20x20)</SelectItem>
                <SelectItem value="large">Large (25x25)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appleCount">Apple Count: {settings.appleCount}</Label>
            <Slider
              id="appleCount"
              min={1}
              max={5}
              step={1}
              value={[settings.appleCount]}
              onValueChange={value => updateSetting('appleCount', value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={settings.theme} onValueChange={value => updateSetting('theme', value as Theme)}>
              <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <Label htmlFor="sound">Sound Effects</Label>
            </div>
            <Switch id="sound" checked={settings.soundEnabled} onCheckedChange={checked => updateSetting('soundEnabled', checked)} />
          </div>

          <Button onClick={() => navigate('/menu')} className="w-full bg-black hover:bg-neutral-800 text-white">
            Save & Return to Menu
          </Button>
        </Card>
      </div>
    </div>
  );
};
