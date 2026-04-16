import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RETRO_GAME_MAP } from '../data/retroGames';

const PURCAR_ASSETS = ['/assets/snake/head.png', '/assets/snake/purcar2.jpeg', '/assets/snake/purcar3.jpeg'];

export const RetroArcadePlayer: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [reloadKey, setReloadKey] = useState(0);

  const game = slug ? RETRO_GAME_MAP[slug] : undefined;
  const purcarImg = useMemo(() => {
    if (!slug) return PURCAR_ASSETS[0];
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash = (hash + slug.charCodeAt(i)) % PURCAR_ASSETS.length;
    return PURCAR_ASSETS[hash];
  }, [slug]);

  if (!game) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p>Jocul nu exista.</p>
        <Button onClick={() => navigate('/arcade')}>Inapoi la Arcade</Button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <iframe
        key={reloadKey}
        title={game.title}
        src={`/browser-games-main/${game.slug}/index.html`}
        className="absolute inset-0 w-full h-full border-0 bg-black"
        allow="autoplay; fullscreen"
      />

      <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4 pointer-events-none">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-black/45 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2 pointer-events-auto">
          <Button variant="outline" onClick={() => navigate('/arcade')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-1" /> Arcade
          </Button>

          <div className="text-center text-white">
            <div className="text-xs uppercase tracking-widest text-white/60">Now Playing</div>
            <div className="font-black">{game.title}</div>
          </div>

          <Button variant="outline" onClick={() => setReloadKey(v => v + 1)} className="rounded-full">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 z-20 rounded-2xl border border-white/30 bg-black/55 p-2 pointer-events-none">
        <img src={purcarImg} alt="Purcar Overlay" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover" draggable={false} />
      </div>
    </main>
  );
};
