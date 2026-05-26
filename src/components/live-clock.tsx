import { useEffect, useRef, useState } from "react";

/**
 * Smooth ticking clock — sweeping second hand, hour ticks, Datamart-style.
 */
export function LiveClock({ className = "h-5 w-5" }: { className?: string }) {
  const [t, setT] = useState(() => performance.now());
  const raf = useRef<number>();
  useEffect(() => {
    const loop = () => {
      setT(performance.now());
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  const now = new Date();
  const ms = now.getMilliseconds();
  const sec = now.getSeconds() + ms / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;

  const polar = (deg: number, len: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: 24 + Math.cos(a) * len, y: 24 + Math.sin(a) * len };
  };
  const h = polar(hr * 30, 10);
  const m = polar(min * 6, 14);
  const s = polar(sec * 6, 16);

  // 12 hour-mark ticks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    const r1 = 19.5, r2 = i % 3 === 0 ? 17 : 18.2;
    return (
      <line
        key={i}
        x1={24 + Math.cos(a) * r1}
        y1={24 + Math.sin(a) * r1}
        x2={24 + Math.cos(a) * r2}
        y2={24 + Math.sin(a) * r2}
        stroke="currentColor"
        strokeWidth={i % 3 === 0 ? 1.6 : 0.9}
        strokeLinecap="round"
        opacity={0.7}
      />
    );
  });

  // suppress unused t warning
  void t;

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-label="Live clock — 24/7">
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" opacity="0.9" />
      {ticks}
      <line x1="24" y1="24" x2={h.x} y2={h.y} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="24" y1="24" x2={m.x} y2={m.y} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="24" x2={s.x} y2={s.y} stroke="hsl(var(--brand-orange))" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="24" cy="24" r="1.8" fill="hsl(var(--brand-orange))" />
    </svg>
  );
}
