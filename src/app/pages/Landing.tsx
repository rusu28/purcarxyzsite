import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const TARGET_DATE_ISO = '2026-05-16T00:00:00+03:00';

const getCountdown = (targetDate: number): Countdown => {
  const diff = Math.max(0, targetDate - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const pad = (value: number) => value.toString().padStart(2, '0');

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const targetDate = useMemo(() => new Date(TARGET_DATE_ISO).getTime(), []);
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-[#1e1f29]" />
      <div className="absolute inset-0 bg-[url('/assets/backgroundlandingpage.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_35%,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-[linear-gradient(to_top,rgba(25,26,36,0.95),rgba(25,26,36,0))]" />

      <section className="relative z-10 min-h-screen px-4 sm:px-5 pt-10 sm:pt-16 pb-10 sm:pb-12 flex flex-col items-center justify-center">
        <h1 className="text-center font-black tracking-[0.12em] sm:tracking-[0.35em] text-xs sm:text-xl uppercase mb-7 sm:mb-10 leading-relaxed">
          ah da inca un pic pana la PLM Alpha ( Purcar Language Model )
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl">
          <FlipTile value={pad(countdown.days)} metric="Days" />
          <FlipTile value={pad(countdown.hours)} metric="Hours" />
          <FlipTile value={pad(countdown.minutes)} metric="Minutes" />
          <FlipTile value={pad(countdown.seconds)} metric="Seconds" />
        </div>

        <p className="mt-8 text-white/80 text-sm sm:text-base text-center">
          Inca un pic pana la uraniu: <span className="font-bold">16 May 2026</span>
        </p>

        <div className="mt-7 sm:mt-8 w-full max-w-md sm:max-w-none flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/game', { state: { mode: 'classic' } })}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/35 bg-[#343650] hover:bg-[#454766] transition-colors font-bold tracking-[0.08em] uppercase"
          >
            Play Snake
          </button>
          <button
            type="button"
            onClick={() => navigate('/flappy')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/35 bg-[#263e67] hover:bg-[#335383] transition-colors font-bold tracking-[0.08em] uppercase"
          >
            Play Flappy
          </button>
          <button
            type="button"
            onClick={() => navigate('/dino')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/35 bg-[#4a3a2a] hover:bg-[#5a4837] transition-colors font-bold tracking-[0.08em] uppercase"
          >
            Play Dino
          </button>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/35 bg-white/10 hover:bg-white/20 transition-colors font-bold tracking-[0.08em] uppercase"
          >
            More Modes
          </button>
          <button
            type="button"
            onClick={() => navigate('/arcade')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/35 bg-[#111111] hover:bg-[#222222] transition-colors font-bold tracking-[0.08em] uppercase"
          >
            Retro Arcade
          </button>
        </div>
      </section>
    </main>
  );
};

const FlipTile: React.FC<{ value: string; metric: string }> = ({ value, metric }) => (
  <div className="text-center">
    <div className="relative h-20 sm:h-28 rounded-lg bg-[#343650] shadow-[0_8px_0_0_#191a24] overflow-hidden border border-black/20">
      <div className="absolute inset-0">
        <div className="h-1/2 bg-black/15" />
      </div>
      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/25">
        <span className="absolute -left-[4px] -top-[3px] w-2 h-2 rounded-full bg-[#1e1f29]" />
        <span className="absolute -right-[4px] -top-[3px] w-2 h-2 rounded-full bg-[#1e1f29]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[#fb6087] text-2xl sm:text-6xl font-black tabular-nums">
        {value}
      </div>
    </div>
    <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.25em] text-[#8486a9]">{metric}</p>
  </div>
);
