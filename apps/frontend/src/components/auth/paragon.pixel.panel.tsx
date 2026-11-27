'use client';

import { useEffect, useRef } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Paragon Social: animated pixel background for the auth screens (replaces the
// testimonials). Coral "comets" drift on their own and the cursor lights up
// the pixels it passes over. Respects prefers-reduced-motion.
const COLORS = [
  [249, 59, 79],
  [255, 107, 124],
  [255, 179, 188],
  [255, 228, 231],
];
const CELL = 10;

export const ParagonPixelPanel = () => {
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!box || !cv || !ctx) {
      return;
    }
    const reduce =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    let px: { v: number; ph: number }[] = [];
    let raf = 0;
    let mouse = { x: -9999, y: -9999 };

    const init = () => {
      const r = box.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = r.width;
      h = r.height;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      px = Array.from({ length: cols * rows }, () => ({
        v: 0,
        ph: Math.random(),
      }));
    };

    const comets = [0, 1, 2].map((i) => ({
      a: Math.random() * 6.28,
      s: 0.25 + i * 0.12,
      rx: 0.35 + i * 0.1,
      ry: 0.28 + i * 0.08,
    }));
    const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
    const colorAt = (v: number) => {
      const f = Math.min(0.999, Math.max(0, v)) * (COLORS.length - 1);
      const i = Math.floor(f);
      const k = f - i;
      const a = COLORS[i];
      const b = COLORS[i + 1];
      return `rgb(${lerp(a[0], b[0], k)},${lerp(a[1], b[1], k)},${lerp(
        a[2],
        b[2],
        k
      )})`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const lights = [{ x: mouse.x, y: mouse.y, r: 90 }];
      comets.forEach((c) => {
        if (!reduce) {
          c.a += 0.016 * c.s;
        }
        lights.push({
          x: w * (0.62 + Math.cos(c.a) * c.rx),
          y: h * (0.38 + Math.sin(c.a * 1.3) * c.ry),
          r: 110,
        });
      });
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = px[i * rows + j];
          if (!p) {
            continue;
          }
          const x = i * CELL;
          const y = j * CELL;
          let target = 0;
          for (const L of lights) {
            const d = Math.hypot(L.x - (x + CELL / 2), L.y - (y + CELL / 2));
            if (d < L.r) {
              target = Math.max(target, Math.pow(1 - d / L.r, 1.6));
            }
          }
          if (!reduce && Math.random() < 0.0006) {
            target = Math.max(target, 0.55);
          }
          p.v += (target - p.v) * (target > p.v ? 0.3 : 0.025);
          ctx.globalAlpha = 0.05;
          ctx.fillStyle = '#141414';
          ctx.fillRect(x, y, CELL - 2, CELL - 2);
          if (p.v > 0.02) {
            p.ph = (p.ph + 0.002) % 1;
            ctx.globalAlpha = Math.min(1, p.v * 0.95);
            ctx.fillStyle = colorAt(p.v * 0.8 + p.ph * 0.2);
            ctx.fillRect(x, y, CELL - 2, CELL - 2);
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const parent = box.parentElement!;
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouse = { x: -9999, y: -9999 };
    };
    parent.addEventListener('pointermove', onMove);
    parent.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', init);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <div className="relative overflow-hidden flex-[1_1_520px] min-h-[420px] hidden lg:flex flex-col justify-end bg-[#F6F7F8] text-[#111214] p-[56px]">
      <div ref={boxRef} aria-hidden="true" className="absolute inset-0">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #F6F7F8 18%, rgba(246,247,248,0.6) 45%, rgba(246,247,248,0) 75%)',
        }}
      />
      <div className="relative flex flex-col gap-[18px] max-w-[480px]">
        <span className="self-start px-[12px] py-[6px] rounded-full bg-[#141414]/[0.06] text-[12px] font-[500]">
          {t('paragon_auth_badge', 'AI growth agency · USA · MX')}
        </span>
        <p className="font-heading m-0 text-[40px] leading-[1.1] font-[600] -tracking-[0.8px]">
          {t('paragon_auth_headline', 'All your channels, one calendar.')}
        </p>
        <p className="m-0 text-[15px] leading-[1.55] text-[#5C5852]">
          {t(
            'paragon_auth_body',
            'Plan, approve and publish on Facebook, Instagram, LinkedIn and more, for your brand and for your clients.'
          )}
        </p>
      </div>
    </div>
  );
};
