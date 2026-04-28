import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Bot, CalendarClock, Gamepad2, LockKeyhole, MessageSquare, Send, Sparkles, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LaunchTimer, LAUNCH_DATE_LABEL, padCountdown, useLaunchCountdown } from '../components/LaunchTimer';

const promptChips = ['Build me a game idea', 'Explain my code', 'Plan my day', 'Roast this bug'];

const statusItems = [
  { label: 'Access', value: 'Locked', tone: 'text-[#f2c14e]' },
  { label: 'Launch', value: LAUNCH_DATE_LABEL, tone: 'text-white' },
  { label: 'Mode', value: 'AI Chat', tone: 'text-[#83e377]' },
  { label: 'King', value: 'Charging', tone: 'text-[#ff6b4a]' },
] as const;

export const Alpha: React.FC = () => {
  const navigate = useNavigate();
  const countdown = useLaunchCountdown();

  return (
    <main className="min-h-screen bg-[#0d1012] text-white">
      <LaunchTimer />
      <header className="site-header-sticky z-40 border-b border-white/10 bg-[#0d1012]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:px-6 sm:py-0 lg:px-8">
          <Button variant="outline" onClick={() => navigate('/')} className="h-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white hover:text-[#11100f]">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>

          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
            <Bot className="h-5 w-5 text-[#83e377]" />
            <span className="hidden sm:inline">Purcar Alpha</span>
          </div>

          <Button onClick={() => navigate('/arcade')} className="h-10 rounded-full bg-white px-4 text-[#11100f] hover:bg-[#f2c14e]">
            <Gamepad2 className="h-4 w-4" />
            Arcade
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src="/assets/backgroundlandingpage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" draggable={false} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0d1012_0%,rgba(13,16,18,0.92)_44%,rgba(13,16,18,0.72)_100%)]" />
        <div className="absolute inset-0 qual-flow-grid opacity-25" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,#0d1012_0%,rgba(13,16,18,0)_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-144px)] max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="qual-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-[#83e377]/30 bg-[#83e377]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#83e377]">
              <Sparkles className="h-3.5 w-3.5" />
              Alpha preview
            </div>

            <h1 className="qual-reveal qual-reveal-delay-1 text-4xl font-black leading-[0.96] tracking-normal sm:text-6xl lg:text-7xl">
              Purcar Alpha is still locked.
            </h1>

            <p className="qual-reveal qual-reveal-delay-2 mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              Soon, you will talk with the Uranium King.
            </p>

            <div className="qual-reveal qual-reveal-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/arcade')} className="h-12 rounded-full bg-[#f2c14e] px-6 text-[#11100f] hover:bg-[#ffd86f]">
                Play While Waiting
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="h-12 rounded-full border-white/30 bg-black/25 px-6 text-white hover:bg-white hover:text-[#11100f]"
              >
                Back to Playground
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <CountdownTile value={padCountdown(countdown.days)} label="Days" />
              <CountdownTile value={padCountdown(countdown.hours)} label="Hours" />
              <CountdownTile value={padCountdown(countdown.minutes)} label="Minutes" />
              <CountdownTile value={padCountdown(countdown.seconds)} label="Seconds" />
            </div>
          </div>

          <section className="qual-panel qual-reveal qual-reveal-delay-2 overflow-hidden rounded-lg border border-white/10 bg-[#15191c]/92 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/28 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#83e377] text-[#10220e]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black">Purcar Alpha</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f2c14e]">Launch locked</p>
                </div>
              </div>
              <LockKeyhole className="h-5 w-5 text-white/45" />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <AlphaBubble label="You" text="Can I ask anything yet?" />
              <AlphaBubble label="Purcar Alpha" text="Not yet. The Uranium King is charging the core." active />
              <AlphaBubble label="Purcar Alpha" text={`Doors open on ${LAUNCH_DATE_LABEL}. Until then, the playground stays online.`} active />

              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                {promptChips.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    disabled
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-left text-sm font-bold text-white/45"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-black/35 p-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 shrink-0 text-white/35" />
                  <input
                    disabled
                    placeholder="Ask anything..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-3 text-white placeholder:text-white/42 outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    aria-label="Purcar Alpha is launching soon"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/42"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#131719] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-4">
          {statusItems.map(item => (
            <div key={item.label} className="bg-[#131719] px-5 py-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                {item.label === 'Launch' ? <CalendarClock className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {item.label}
              </div>
              <div className={`mt-2 text-xl font-black ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

const CountdownTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center backdrop-blur">
    <div className="font-mono text-3xl font-black text-[#83e377]">{value}</div>
    <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/50">{label}</div>
  </div>
);

const AlphaBubble: React.FC<{ label: string; text: string; active?: boolean }> = ({ label, text, active = false }) => (
  <div className={`rounded-lg border p-4 ${active ? 'border-[#83e377]/35 bg-[#83e377]/10' : 'border-white/10 bg-black/25'}`}>
    <div className={`text-xs font-black uppercase tracking-[0.16em] ${active ? 'text-[#83e377]' : 'text-white/45'}`}>
      {label}
    </div>
    <p className="mt-2 leading-7 text-white/75">{text}</p>
  </div>
);
