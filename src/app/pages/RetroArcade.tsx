import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RETRO_GAMES } from '../data/retroGames';

const PURCAR_ASSETS = ['/assets/snake/head.png', '/assets/snake/purcar2.jpeg', '/assets/snake/purcar3.jpeg'];

export const RetroArcade: React.FC = () => {
  const navigate = useNavigate();

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

        <p className="text-center text-white/75 mb-8">Toate jocurile din `browser-games-main`, lansate direct din site.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RETRO_GAMES.map((game, index) => (
            <article key={game.slug} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{game.title}</h2>
                <span className="text-xs text-white/60">{game.year}</span>
              </div>

              <div className="h-28 rounded-xl bg-black/35 border border-white/10 mb-4 flex items-center justify-center overflow-hidden relative">
                <img
                  src={PURCAR_ASSETS[index % PURCAR_ASSETS.length]}
                  alt="Purcar"
                  className="h-20 w-20 rounded-full object-cover opacity-80"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_10%,rgba(0,0,0,0.55)_80%)]" />
              </div>

              <Button onClick={() => navigate(`/arcade/${game.slug}`)} className="w-full bg-white text-black hover:bg-white/90 font-bold">
                <Play className="w-4 h-4 mr-1" /> Play
              </Button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};
