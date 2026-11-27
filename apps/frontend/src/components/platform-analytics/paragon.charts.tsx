'use client';

import React, { FC, useMemo, useState } from 'react';
import dayjs from 'dayjs';

// Paragon Social: analytics charts, built from the "Analítica" screens of the
// Claude Design redesign. Plain SVG, no chart library.

export interface ParagonSeries {
  label: string;
  points: Array<{ date: string; value: number }>;
  average?: boolean;
}

export const formatNumber = (value: number, average?: boolean) => {
  if (average) {
    return value.toFixed(2) + '%';
  }
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 100000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  if (Math.abs(value) >= 10000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const smoothPath = (points: Array<[number, number]>) => {
  if (!points.length) return '';
  let path = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    path += ` C${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(
      1
    )} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return path;
};

const niceMax = (value: number) => {
  if (value <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s * power >= value) || 10;
  return step * power;
};

export const Sparkline: FC<{ values: number[]; color: string }> = ({
  values,
  color,
}) => {
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '' };
    const max = Math.max(...values);
    const min = Math.min(...values);
    const step = 200 / (values.length - 1);
    const pts = values.map(
      (v, i) =>
        [i * step, 36 - ((v - min) / (max - min || 1)) * 30] as [number, number]
    );
    const l = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
    return { line: l, area: `${l} L200 40 L0 40 Z` };
  }, [values]);

  if (!line) return <div className="h-[40px]" />;

  return (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className="w-full h-[40px] block"
      aria-hidden="true"
    >
      <path d={area} fill={color} fillOpacity={0.1} className="paragon-fade" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="paragon-draw"
        style={{ ['--len' as any]: 400 }}
      />
    </svg>
  );
};

const VIEW_W = 720;
const VIEW_H = 260;
const X0 = 44;
const X1 = 676;
const Y0 = 16;
const PLOT_H = 210;

export const ComboChart: FC<{
  bars?: ParagonSeries;
  line?: ParagonSeries;
  barColor: string;
  lineColor: string;
}> = ({ bars, line, barColor, lineColor }) => {
  const [hover, setHover] = useState(-1);

  const dates = useMemo(() => {
    const all = new Set<string>();
    bars?.points.forEach((p) => all.add(p.date));
    line?.points.forEach((p) => all.add(p.date));
    return Array.from(all).sort();
  }, [bars, line]);

  const value = (series: ParagonSeries | undefined, date: string) =>
    series?.points.find((p) => p.date === date)?.value;

  const chart = useMemo(() => {
    const n = dates.length || 1;
    const step = (X1 - X0) / n;
    const barMax = niceMax(Math.max(0, ...(bars?.points.map((p) => p.value) || [0])));
    const lineValues = line?.points.map((p) => p.value) || [];
    const lineMax = niceMax(Math.max(0, ...lineValues));
    const by = (v: number) => Y0 + PLOT_H - (v / barMax) * PLOT_H;
    const ly = (v: number) => Y0 + PLOT_H - (v / lineMax) * PLOT_H;
    const barRects = bars
      ? dates.map((date, i) => {
          const v = value(bars, date) || 0;
          return {
            x: X0 + i * step + step * 0.18,
            w: Math.max(2, step * 0.64),
            y: by(v),
            h: Y0 + PLOT_H - by(v),
          };
        })
      : [];
    const linePts = line
      ? dates
          .map((date, i) => {
            const v = value(line, date);
            return v === undefined
              ? null
              : ([X0 + i * step + step / 2, ly(v)] as [number, number]);
          })
          .filter(Boolean) as Array<[number, number]>
      : [];
    const grid = [0, 0.25, 0.5, 0.75, 1].map((k) => ({
      y: Y0 + PLOT_H - k * PLOT_H,
      left: bars ? formatNumber(barMax * k, bars.average) : '',
      right: line ? formatNumber(lineMax * k, line.average) : '',
    }));
    const every = Math.max(1, Math.ceil(n / 7));
    const labels = dates
      .map((date, i) => ({ date, i }))
      .filter(({ i }) => i % every === 0 || i === n - 1)
      .map(({ date, i }) => ({
        x: X0 + i * step + step / 2,
        label: dayjs(date).format('D MMM'),
      }));
    return { step, barRects, linePath: smoothPath(linePts), grid, labels };
  }, [dates, bars, line]);

  if (!dates.length) return null;

  const hoverDate = hover >= 0 ? dates[hover] : undefined;
  const hoverX = hover >= 0 ? X0 + hover * chart.step + chart.step / 2 : 0;

  return (
    <div className="relative" onPointerLeave={() => setHover(-1)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto block overflow-visible"
        role="img"
        aria-label={[bars?.label, line?.label].filter(Boolean).join(' · ')}
      >
        {chart.grid.map((g) => (
          <g key={g.y}>
            <line x1={X0} x2={X1} y1={g.y} y2={g.y} stroke="#f1f2f4" />
            <text x={X0 - 8} y={g.y + 4} textAnchor="end" fontSize={11} fill="#8a8e96">
              {g.left}
            </text>
            <text x={X1 + 8} y={g.y + 4} fontSize={11} fill={lineColor}>
              {g.right}
            </text>
          </g>
        ))}
        {chart.barRects.map((b, i) => (
          <rect
            key={i}
            className="paragon-grow"
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={Math.min(4, b.w / 2)}
            fill={barColor}
            fillOpacity={hover === -1 || hover === i ? 1 : 0.45}
            style={{ animationDelay: `${Math.min(i, 60) * 15}ms` }}
          />
        ))}
        {!!chart.linePath && (
          <path
            d={chart.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="paragon-draw"
            style={{ ['--len' as any]: 1800 }}
          />
        )}
        {chart.labels.map((l) => (
          <text key={l.x} x={l.x} y={VIEW_H - 4} textAnchor="middle" fontSize={11} fill="#8a8e96">
            {l.label}
          </text>
        ))}
        {hover >= 0 && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={Y0 - 4}
            y2={Y0 + PLOT_H}
            stroke="#111214"
            strokeDasharray="3 3"
            opacity={0.35}
          />
        )}
        {dates.map((date, i) => (
          <rect
            key={date}
            x={X0 + i * chart.step}
            y={Y0}
            width={chart.step}
            height={PLOT_H}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hoverDate && (
        <div
          className="absolute top-[8px] w-[190px] px-[12px] py-[10px] rounded-[12px] bg-[#111214] text-white flex flex-col gap-[4px] shadow-[0_10px_30px_rgba(17,18,20,.25)] pointer-events-none"
          style={{
            left:
              hover > dates.length * 0.65
                ? `calc(${((hoverX / VIEW_W) * 100).toFixed(1)}% - 204px)`
                : `calc(${((hoverX / VIEW_W) * 100).toFixed(1)}% + 14px)`,
          }}
        >
          <span className="text-[12px] text-[#c6c9cf]">
            {dayjs(hoverDate).format('D MMMM YYYY')}
          </span>
          {[
            { s: bars, c: barColor },
            { s: line, c: lineColor },
          ]
            .filter((x) => x.s)
            .map(({ s, c }) => (
              <div key={s!.label} className="flex justify-between gap-[12px] text-[13px]">
                <span className="flex items-center gap-[6px] truncate">
                  <span className="w-[8px] h-[8px] rounded-[2px] shrink-0" style={{ background: c }} />
                  <span className="truncate">{s!.label}</span>
                </span>
                <strong>{formatNumber(value(s, hoverDate) || 0, s!.average)}</strong>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export const BreakdownBars: FC<{
  items: Array<{ label: string; value: number }>;
  colors: string[];
}> = ({ items, colors }) => {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.value - a.value),
    [items]
  );
  const max = Math.max(1, ...sorted.map((i) => i.value));
  return (
    <div className="flex flex-col gap-[14px]">
      {sorted.map((item, i) => (
        <div key={item.label} className="flex flex-col gap-[6px]">
          <div className="flex justify-between text-[13px]">
            <span className="font-[500] text-[#111214]">{item.label}</span>
            <strong className="text-[#111214] tabular-nums">
              {formatNumber(item.value)}
            </strong>
          </div>
          <div className="h-[10px] rounded-full bg-[#f1f2f4] overflow-hidden">
            <div
              className="h-full rounded-full paragon-grow-x"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: colors[i % colors.length],
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
