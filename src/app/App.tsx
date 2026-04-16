import { RouterProvider } from 'react-router';
import { useEffect } from 'react';
import { router } from './routes';
import { applyThemeClass, loadStoredSettings } from './utils/settings';

export default function App() {
  useEffect(() => {
    const settings = loadStoredSettings();
    applyThemeClass(settings.theme);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'snake-settings') return;
      const nextSettings = loadStoredSettings();
      applyThemeClass(nextSettings.theme);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <RouterProvider router={router} />;
}
