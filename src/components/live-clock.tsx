import { useEffect, useState } from "react";

export function LiveClock({ className = "h-5 w-5" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = now.getSeconds();
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  const polar = (angleDeg: number, len: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: 12 + Math.cos(a) * len, y: 12 + Math.sin(a) * len };
  };
  const h = polar(hr * 30, 4);
  const m = polar(min * 6, 6);
  const s = polar(sec * 6, 7);
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="12" x2={h.x} y2={h.y} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="12" x2={m.x} y2={m.y} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12" y1="12" x2={s.x} y2={s.y} stroke="hsl(var(--brand-orange))" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
