import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { GEOMETRY_GAMES, RETRO_GAMES, SUPERMARIO_GAMES } from '../data/arcadeGames';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

export const RetroArcade: React.FC = () => {
  const navigate = useNavigate();
  const settings = loadStoredSettings();
  const purcarPreview = resolvePurcarAvatar(settings.purcarAvatar, Date.now());

  const renderGameGrid = (games: typeof RETRO_GAMES, source: 'retro' | 'supermario' | 'geometry') => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map(game => (
        <article key={`${source}:${game.slug}`} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{game.title}</h2>
            <span className="text-xs text-white/60">{game.year ?? 'Web'}</span>
          </div>

          <div className="h-28 rounded-xl bg-black/35 border border-white/10 mb-4 flex items-center justify-center overflow-hidden relative">
            <img src={purcarPreview} alt="Purcar" className="h-20 w-20 rounded-full object-cover opacity-80" draggable={false} />
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_10%,rgba(0,0,0,0.55)_80%)]" />
          </div>

          <Button onClick={() => navigate(`/arcade/${source}/${game.slug}`)} className="w-full bg-white text-black hover:bg-white/90 font-bold">
            <Play className="w-4 h-4 mr-1" /> Play
          </Button>
        </article>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/menu')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1" /> Menu
          </Button>
          <h1 className="text-2xl sm:text-4xl font-black tracking-wide text-center">PURCAR RETRO ARCADE</h1>
          <div className="w-[90px]" />
        </div>

        <p className="text-center text-white/75 mb-8">Toate jocurile din `browser-games-main` + `supermario/html-css-javascript-games-main`.</p>

        <h2 className="text-xl font-black mb-4">Retro Classics</h2>
        {renderGameGrid(RETRO_GAMES, 'retro')}

        <h2 className="text-xl font-black mt-10 mb-4">HTML/CSS/JavaScript Games Pack</h2>
        {renderGameGrid(SUPERMARIO_GAMES, 'supermario')}

        <h2 className="text-xl font-black mt-10 mb-4">Geometry</h2>
        {renderGameGrid(GEOMETRY_GAMES, 'geometry')}
      </div>
    </main>
  );
};
