import React, { useEffect, useMemo, useState } from 'react';
import { Rocket } from 'lucide-react';

export type LaunchCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export const LAUNCH_DATE_ISO = '2026-05-27T00:00:00+03:00';
export const LAUNCH_DATE_LABEL = '27 May 2026';
export const LAUNCH_TITLE = 'Countdown till Purcar Alpha (AI Chat)';

const getCountdown = (targetDate: number): LaunchCountdown => {
  const diff = Math.max(0, targetDate - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

export const padCountdown = (value: number) => value.toString().padStart(2, '0');

export const useLaunchCountdown = () => {
  const targetDate = useMemo(() => new Date(LAUNCH_DATE_ISO).getTime(), []);
  const [countdown, setCountdown] = useState<LaunchCountdown>(() => getCountdown(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return countdown;
};

export const LaunchTimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const countdown = useLaunchCountdown();

  return (
    <div className={`launch-timer z-50 h-[88px] border-b border-white/10 bg-[#0c0e10]/95 text-white backdrop-blur-xl sm:h-11 ${className}`}>
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-2 px-3 py-2 sm:flex-row sm:justify-between sm:px-6 sm:py-0 lg:px-8">
        <div className="flex min-w-0 items-center justify-center gap-2 text-center text-[10px] font-black uppercase leading-tight tracking-[0.14em] text-[#f2c14e] sm:justify-start sm:text-xs sm:tracking-[0.18em]">
          <Rocket className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Purcar Alpha AI Chat</span>
          <span className="hidden sm:inline">{LAUNCH_TITLE}</span>
          <span className="hidden text-white/45 sm:inline">/ {LAUNCH_DATE_LABEL}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-black tabular-nums sm:text-sm">
          <TimerPill value={countdown.days} label="d" />
          <TimerPill value={countdown.hours} label="h" />
          <TimerPill value={countdown.minutes} label="m" />
          <TimerPill value={countdown.seconds} label="s" />
        </div>
      </div>
    </div>
  );
};

const TimerPill: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <span className="inline-flex min-w-11 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 sm:min-w-14 sm:px-2.5">
    <span>{padCountdown(value)}</span>
    <span className="text-[10px] uppercase text-white/50">{label}</span>
  </span>
);
