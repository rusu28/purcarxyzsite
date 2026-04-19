import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ARCADE_GAME_MAP, getArcadeGameSrc } from '../data/arcadeGames';
import { loadStoredSettings, resolvePurcarAvatar } from '../utils/settings';

export const RetroArcadePlayer: React.FC = () => {
  const navigate = useNavigate();
  const { source, slug } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const game = source && slug ? ARCADE_GAME_MAP[`${source}:${slug}`] : undefined;
  const purcarImg = useMemo(() => {
    const settings = loadStoredSettings();
    return resolvePurcarAvatar(settings.purcarAvatar, Date.now());
  }, [reloadKey]);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;

    const enhanceIframe = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;

        if (!doc.getElementById('purcar-global-style')) {
          const style = doc.createElement('style');
          style.id = 'purcar-global-style';
          style.textContent = `
            .purcar-skin-block {
              background-image: url('${purcarImg}') !important;
              background-size: cover !important;
              background-position: center !important;
              border-radius: 6px !important;
            }
            .purcar-bg-skin {
              background-image: url('${purcarImg}') !important;
              background-size: cover !important;
              background-position: center !important;
            }
            .purcar-force-img {
              object-fit: cover !important;
            }
            .purcar-canvas-frame {
              outline: 2px solid rgba(255,255,255,0.35) !important;
              box-shadow: 0 0 0 5px rgba(0,0,0,0.25), 0 0 40px rgba(0,0,0,0.45) !important;
              background-image: linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url('${purcarImg}') !important;
              background-size: cover !important;
              background-position: center !important;
            }
            .purcar-overlay-badge {
              position: fixed;
              right: 10px;
              bottom: 10px;
              width: 64px;
              height: 64px;
              z-index: 2147483647;
              border-radius: 9999px;
              border: 2px solid rgba(255,255,255,0.65);
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            }
            .purcar-3d-layer {
              position: fixed;
              inset: 0;
              pointer-events: none;
              z-index: 2147483646;
              perspective: 900px;
              overflow: hidden;
            }
            .purcar-3d-face {
              position: absolute;
              width: 72px;
              height: 72px;
              border-radius: 14px;
              object-fit: cover;
              opacity: 0.28;
              filter: drop-shadow(0 8px 16px rgba(0,0,0,0.45));
              transform-style: preserve-3d;
              animation: purcarSpin3d 8s linear infinite;
            }
            .purcar-3d-face.size-lg {
              width: 110px;
              height: 110px;
              opacity: 0.2;
            }
            @keyframes purcarSpin3d {
              0% { transform: rotateY(0deg) rotateX(0deg) translateZ(0); }
              50% { transform: rotateY(180deg) rotateX(12deg) translateZ(28px); }
              100% { transform: rotateY(360deg) rotateX(0deg) translateZ(0); }
            }
          `;
          doc.head.appendChild(style);
        }

        const applyPurcarSkins = () => {
          const commonBlockSelectors = [
            '.tile', '.block', '.cell', '.cube', '.brick', '.box', '.square', '.card', '.piece', '.dot',
            '[class*="tile"]', '[class*="block"]', '[class*="cell"]', '[class*="brick"]', '[class*="cube"]'
          ];
          doc.querySelectorAll(commonBlockSelectors.join(',')).forEach(node => {
            if (node instanceof HTMLElement) node.classList.add('purcar-skin-block');
          });

          doc.querySelectorAll('img').forEach(node => {
            if (!(node instanceof HTMLImageElement)) return;
            if (node.id === 'purcar-overlay-badge') return;
            node.classList.add('purcar-force-img');
            node.src = purcarImg;
          });

          doc.querySelectorAll('canvas').forEach(node => {
            if (!(node instanceof HTMLCanvasElement)) return;
            node.classList.add('purcar-canvas-frame');
          });

          const bgCandidates = doc.querySelectorAll('div, section, article, span, li, button');
          bgCandidates.forEach(node => {
            if (!(node instanceof HTMLElement)) return;
            const style = window.getComputedStyle(node);
            if (!style.backgroundImage || style.backgroundImage === 'none') return;
            node.classList.add('purcar-bg-skin');
          });
        };

        applyPurcarSkins();

        if (!doc.getElementById('purcar-3d-layer')) {
          const layer = doc.createElement('div');
          layer.id = 'purcar-3d-layer';
          layer.className = 'purcar-3d-layer';
          const points = [
            { x: '6%', y: '10%', lg: false },
            { x: '84%', y: '14%', lg: true },
            { x: '16%', y: '70%', lg: true },
            { x: '76%', y: '72%', lg: false },
            { x: '45%', y: '42%', lg: false },
          ];

          points.forEach((point, index) => {
            const face = doc.createElement('img');
            face.src = purcarImg;
            face.alt = 'Purcar 3D';
            face.className = `purcar-3d-face${point.lg ? ' size-lg' : ''}`;
            face.style.left = point.x;
            face.style.top = point.y;
            face.style.animationDelay = `${index * 0.9}s`;
            layer.appendChild(face);
          });

          doc.body.appendChild(layer);
        } else {
          doc.querySelectorAll('.purcar-3d-face').forEach(node => {
            if (node instanceof HTMLImageElement) node.src = purcarImg;
          });
        }

        let badge = doc.getElementById('purcar-overlay-badge') as HTMLImageElement | null;
        if (!badge) {
          badge = doc.createElement('img');
          badge.id = 'purcar-overlay-badge';
          badge.className = 'purcar-overlay-badge';
          badge.alt = 'Purcar';
          badge.draggable = false;
          doc.body.appendChild(badge);
        }
        badge.src = purcarImg;

        if (!(doc as Document & { __purcarObserver?: MutationObserver }).__purcarObserver) {
          const observer = new MutationObserver(() => applyPurcarSkins());
          observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
          (doc as Document & { __purcarObserver?: MutationObserver }).__purcarObserver = observer;
        }
      } catch {
        // Ignore cross-document patch failures.
      }
    };

    frame.addEventListener('load', enhanceIframe);
    return () => frame.removeEventListener('load', enhanceIframe);
  }, [purcarImg, reloadKey]);

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
        ref={iframeRef}
        title={game.title}
        src={getArcadeGameSrc(game)}
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
