'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { Integration } from '@prisma/client';
import useSWR from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { spot } from '@gitroom/frontend/components/ui/paragon.spot';
import {
  networkName,
  PARAGON_NETWORK_COLORS,
} from '@gitroom/frontend/components/new-layout/paragon.sidebar';
import {
  BreakdownBars,
  ComboChart,
  formatNumber,
  ParagonSeries,
  Sparkline,
} from '@gitroom/frontend/components/platform-analytics/paragon.charts';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';

// Paragon Social: channel analytics, built from the "Analítica" screens of
// the Claude Design redesign. Every provider returns the same shape (a label
// and a list of daily values), so the screen is the same for every network:
// metrics with several days become time series, metrics with a single value
// (totals for the period) become the breakdown.

interface AnalyticsDataItem {
  label: string;
  data: Array<{ total: number | string; date: string }>;
  average?: boolean;
}

const BREAKDOWN_COLORS = ['#f93b4f', '#111214', '#1f5fd1', '#f4a62a', '#2f9e67', '#8a8e96'];

const useChannelAnalytics = (integrationId: string | undefined, days: number) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch(`/analytics/${integrationId}?date=${days}`)).json();
  }, [integrationId, days]);
  return useSWR<AnalyticsDataItem[]>(
    integrationId ? `/analytics-${integrationId}-${days}` : null,
    load,
    {
      refreshInterval: 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshWhenOffline: false,
      revalidateOnMount: true,
    }
  );
};

interface ChannelPost {
  id: string;
  text: string;
  publishDate: string;
  releaseURL?: string;
  metrics: Record<string, number>;
}

// posts published from the app in the period, with the metrics the network
// returns for each one (the same endpoint as the post preview statistics)
const useChannelPosts = (integrationId: string | undefined, days: number) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    const list = await (
      await fetch(
        `/posts/list?state=published&limit=40&integrations=${integrationId}`
      )
    ).json();
    const since = newDayjs().subtract(days, 'day');
    const posts = (list?.posts || []).filter(
      (p: any) => p.releaseId && newDayjs(p.publishDate).isAfter(since)
    );
    const result: ChannelPost[] = [];
    for (let i = 0; i < posts.length; i += 6) {
      const chunk = await Promise.all(
        posts.slice(i, i + 6).map(async (post: any) => {
          try {
            const data = await (
              await fetch(`/analytics/post/${post.id}?date=${days}`)
            ).json();
            const metrics: Record<string, number> = {};
            (Array.isArray(data) ? data : []).forEach((m: any) => {
              metrics[m.label] = (m.data || []).reduce(
                (acc: number, d: any) => acc + (Number(d.total) || 0),
                0
              );
            });
            return {
              id: post.id,
              text: stripHtmlValidation('none', post.content || '')
                .replace(/\s+/g, ' ')
                .trim(),
              publishDate: post.publishDate,
              releaseURL: post.releaseURL,
              metrics,
            } as ChannelPost;
          } catch {
            return null;
          }
        })
      );
      chunk.forEach((p) => p && result.push(p));
    }
    return result;
  }, [integrationId, days]);
  return useSWR<ChannelPost[]>(
    integrationId ? `/analytics-posts-${integrationId}-${days}` : null,
    load,
    {
      refreshInterval: 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshWhenOffline: false,
      revalidateOnMount: true,
    }
  );
};

const splitAnalytics = (data?: AnalyticsDataItem[]) => {
  const series: ParagonSeries[] = [];
  const totals: Array<{ label: string; value: number; average?: boolean }> = [];
  (Array.isArray(data) ? data : []).forEach((item) => {
    const points = (item.data || [])
      .map((p) => ({ date: p.date, value: Number(p.total) || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length > 1) {
      series.push({ label: item.label, points, average: item.average });
    } else {
      totals.push({
        label: item.label,
        value: points[0]?.value || 0,
        average: item.average,
      });
    }
  });
  return { series, totals };
};

const seriesTotal = (s: ParagonSeries) => {
  const sum = s.points.reduce((acc, p) => acc + p.value, 0);
  return s.average ? sum / (s.points.length || 1) : sum;
};

// change of the second half of the period against the first half
const seriesTrend = (s: ParagonSeries) => {
  if (s.points.length < 4) return undefined;
  const half = Math.floor(s.points.length / 2);
  const first = s.points.slice(0, half);
  const second = s.points.slice(s.points.length - half);
  const sum = (arr: typeof first) => arr.reduce((acc, p) => acc + p.value, 0);
  if (s.average) {
    return { value: sum(second) / half - sum(first) / half, points: true };
  }
  const a = sum(first);
  if (!a) return undefined;
  return { value: ((sum(second) - a) / a) * 100, points: false };
};

const TrendBadge: FC<{ trend?: { value: number; points: boolean } }> = ({ trend }) => {
  if (!trend || !isFinite(trend.value) || Math.abs(trend.value) < 0.05) {
    return null;
  }
  const up = trend.value > 0;
  return (
    <span
      className={clsx(
        'px-[8px] py-[3px] rounded-full text-[12px] font-[600] whitespace-nowrap',
        up ? 'bg-[#e8f6ee] text-[#1f7a4d]' : 'bg-[#fdecee] text-[#b42234]'
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}
      {trend.points ? ' pts' : '%'}
    </span>
  );
};

const Card: FC<{ className?: string; children: any }> = ({ className, children }) => (
  <div
    className={clsx(
      'bg-white border border-[#eceef1] rounded-[20px] p-[22px] flex flex-col gap-[14px] min-w-0',
      className
    )}
  >
    {children}
  </div>
);

const CardTitle: FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div>
    <h2 className="m-0 font-heading font-[600] text-[18px] text-[#111214]">{title}</h2>
    {!!subtitle && <p className="mt-[4px] mb-0 text-[13px] text-[#5d616a]">{subtitle}</p>}
  </div>
);

const SeriesSelect: FC<{
  label: string;
  color: string;
  value: number;
  options: ParagonSeries[];
  onChange: (index: number) => void;
}> = ({ label, color, value, options, onChange }) => (
  <label className="flex items-center gap-[8px] h-[36px] ps-[12px] pe-[4px] rounded-[10px] border border-[#dfe1e5] bg-white text-[13px]">
    <span className="w-[10px] h-[10px] rounded-[3px]" style={{ background: color }} aria-hidden="true" />
    <span className="text-[#5d616a]">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      className="h-[28px] bg-transparent text-[#111214] font-[500] outline-none cursor-pointer"
    >
      <option value={-1}>—</option>
      {options.map((o, i) => (
        <option key={o.label} value={i}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

const EmptyState: FC<{ integration: Integration & { identifier?: string } }> = ({
  integration,
}) => {
  const t = useT();
  const fetch = useFetch();
  const reconnect = useCallback(async () => {
    const { url } = await (
      await fetch(
        `/integrations/social/${integration.identifier || integration.providerIdentifier}?refresh=${integration.internalId}`,
        { method: 'GET' }
      )
    ).json();
    window.location.href = url;
  }, [integration]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-[12px] py-[56px] px-[24px] bg-white border border-[#eceef1] rounded-[20px]">
      <p className="m-0 max-w-[440px] text-[15px] text-[#5d616a]">
        {t(
          'no_analytics_to_show_for_this_channel',
          'No analytics to show for this channel. If you expected to see data, try reconnecting the channel.'
        )}
      </p>
      <button
        type="button"
        onClick={reconnect}
        className="h-[44px] px-[20px] rounded-[12px] bg-[#111214] hover:bg-[#2a2c31] text-white text-[14px] font-[600]"
      >
        {t('reconnect_channel', 'Reconnect channel')}
      </button>
    </div>
  );
};

const HEAT_COLORS = ['#fde8ea', '#fbc3ca', '#f88f9b', '#f5606f', '#e2283c', '#b42234'];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

const PostsInsights: FC<{ integrationId: string; days: number }> = ({
  integrationId,
  days,
}) => {
  const t = useT();
  const { data, isLoading } = useChannelPosts(integrationId, days);
  const posts = useMemo(
    () => (data || []).filter((p) => Object.keys(p.metrics).length),
    [data]
  );
  const labels = useMemo(() => {
    const totals: Record<string, number> = {};
    posts.forEach((p) =>
      Object.entries(p.metrics).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      })
    );
    return Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
  }, [posts]);
  const [choice, setChoice] = useState<string | undefined>();
  const metric = choice && labels.includes(choice) ? choice : labels[0];

  const top = useMemo(
    () =>
      [...posts]
        .sort((a, b) => (b.metrics[metric] || 0) - (a.metrics[metric] || 0))
        .slice(0, 8),
    [posts, metric]
  );

  const heat = useMemo(() => {
    const cells: Array<Array<{ sum: number; count: number }>> = Array.from(
      { length: 7 },
      () => HOURS.map(() => ({ sum: 0, count: 0 }))
    );
    posts.forEach((p) => {
      const d = newDayjs(p.publishDate);
      const day = (d.day() + 6) % 7;
      const bucket = Math.min(7, Math.floor(d.hour() / 3));
      cells[day][bucket].sum += p.metrics[metric] || 0;
      cells[day][bucket].count += 1;
    });
    const avgs = cells.map((row) =>
      row.map((c) => (c.count ? c.sum / c.count : undefined))
    );
    const max = Math.max(0, ...avgs.flat().map((v) => v || 0));
    let best: { day: number; bucket: number } | undefined;
    avgs.forEach((row, day) =>
      row.forEach((v, bucket) => {
        if (v !== undefined && max > 0 && v === max && !best) {
          best = { day, bucket };
        }
      })
    );
    return { avgs, max, best };
  }, [posts, metric]);

  if (isLoading) {
    return (
      <Card>
        <CardTitle title={t('paragon_analytics_top_posts', 'Top posts')} />
        <div className="flex items-center justify-center py-[32px]">
          <LoadingComponent />
        </div>
      </Card>
    );
  }

  if (!posts.length) {
    return (
      <Card>
        <CardTitle
          title={t('paragon_analytics_top_posts', 'Top posts')}
          subtitle={t(
            'paragon_analytics_top_posts_empty',
            'Post rankings and the best time to post appear here once you publish from Paragon Social in this period.'
          )}
        />
      </Card>
    );
  }

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    newDayjs().day((i + 1) % 7).format('ddd')
  );
  const columns = labels.slice(0, 4);

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-[12px]">
          <CardTitle
            title={t('paragon_analytics_top_posts', 'Top posts')}
            subtitle={t(
              'paragon_analytics_top_posts_hint',
              'Posts published from Paragon Social in this period'
            )}
          />
          <label className="flex items-center gap-[8px] h-[36px] ps-[12px] pe-[4px] rounded-[10px] border border-[#dfe1e5] bg-white text-[13px]">
            <span className="text-[#5d616a]">
              {t('paragon_analytics_sort_by', 'Sort by')}
            </span>
            <select
              value={metric}
              onChange={(e) => setChoice(e.target.value)}
              className="h-[28px] bg-transparent text-[#111214] font-[500] outline-none cursor-pointer"
            >
              {labels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="text-start text-[#5d616a]">
                <th className="text-start font-[500] py-[8px] px-[6px]">
                  {t('paragon_analytics_post', 'Post')}
                </th>
                <th className="text-start font-[500] py-[8px] px-[6px]">
                  {t('paragon_analytics_date', 'Date')}
                </th>
                {columns.map((c) => (
                  <th
                    key={c}
                    className={clsx(
                      'text-end font-[500] py-[8px] px-[6px]',
                      c === metric && 'text-[#111214]'
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top.map((p, i) => (
                <tr key={p.id} className="border-t border-[#f1f2f4]">
                  <td className="py-[10px] px-[6px]">
                    <div className="flex items-center gap-[12px]">
                      <span
                        className={clsx(
                          'w-[28px] h-[28px] shrink-0 rounded-[8px] grid place-items-center text-[12px] font-[700]',
                          i < 3
                            ? 'bg-[#fff5f6] text-[#d42a3e]'
                            : 'bg-[#f6f7f8] text-[#5d616a]'
                        )}
                      >
                        {i + 1}
                      </span>
                      {p.releaseURL ? (
                        <a
                          href={p.releaseURL}
                          target="_blank"
                          rel="noreferrer"
                          className="font-[500] text-[#111214] hover:text-[#f93b4f] line-clamp-2 max-w-[420px]"
                        >
                          {p.text || '—'}
                        </a>
                      ) : (
                        <span className="font-[500] text-[#111214] line-clamp-2 max-w-[420px]">
                          {p.text || '—'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-[10px] px-[6px] text-[#5d616a] whitespace-nowrap">
                    {newDayjs(p.publishDate).format('D MMM')}
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c}
                      className={clsx(
                        'py-[10px] px-[6px] text-end tabular-nums',
                        c === metric ? 'font-[600] text-[#111214]' : 'text-[#5d616a]'
                      )}
                    >
                      {p.metrics[c] === undefined ? '—' : formatNumber(p.metrics[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-[12px]">
          <CardTitle
            title={t('paragon_analytics_best_time', 'Best time to post')}
            subtitle={t(
              'paragon_analytics_best_time_hint',
              'Average {{metric}} by day and time, based on {{count}} posts',
              { metric, count: posts.length }
            )}
          />
          {!!heat.best && (
            <span className="px-[12px] py-[8px] rounded-[12px] bg-[#fff5f6] text-[#b42234] text-[13px] font-[500]">
              {t('paragon_analytics_best', 'Best')}: {dayNames[heat.best.day]}{' '}
              {String(HOURS[heat.best.bucket]).padStart(2, '0')}:00–
              {String(HOURS[heat.best.bucket] + 3).padStart(2, '0')}:00
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[44px_repeat(8,minmax(44px,1fr))] gap-[4px] min-w-[440px]">
            <span />
            {HOURS.map((h) => (
              <span key={h} className="text-[11px] text-[#8a8e96] text-center">
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
            {heat.avgs.map((row, day) => (
              <div key={day} className="contents">
                <span className="text-[12px] text-[#5d616a] flex items-center capitalize">
                  {dayNames[day]}
                </span>
                {row.map((v, bucket) => {
                  const level =
                    v === undefined || !heat.max
                      ? -1
                      : Math.min(5, Math.floor((v / heat.max) * 5.999));
                  return (
                    <span
                      key={bucket}
                      title={
                        v === undefined
                          ? ''
                          : `${dayNames[day]} ${HOURS[bucket]}:00 · ${formatNumber(v)} ${metric}`
                      }
                      className="block aspect-[1.6] rounded-[6px] transition-transform hover:scale-110"
                      style={{
                        background: level < 0 ? '#f6f7f8' : HEAT_COLORS[level],
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[8px] text-[12px] text-[#5d616a]">
          {t('paragon_analytics_less', 'Less')}
          {HEAT_COLORS.map((c) => (
            <span key={c} className="w-[16px] h-[12px] rounded-[4px]" style={{ background: c }} />
          ))}
          {t('paragon_analytics_more', 'More')}
          <span className="ms-[12px] flex items-center gap-[6px]">
            <span className="w-[16px] h-[12px] rounded-[4px] bg-[#f6f7f8] border border-[#eceef1]" />
            {t('paragon_analytics_no_posts', 'No posts')}
          </span>
        </div>
      </Card>
    </>
  );
};

export const RenderAnalytics: FC<{
  integration: Integration & { identifier?: string };
  date: number;
}> = ({ integration, date }) => {
  const t = useT();
  const { data, isLoading } = useChannelAnalytics(integration?.id, date);
  const { series, totals } = useMemo(() => splitAnalytics(data), [data]);
  const color =
    PARAGON_NETWORK_COLORS[integration.identifier || integration.providerIdentifier] ||
    '#f93b4f';

  // the largest series as bars, the next one as the line
  const ranked = useMemo(
    () =>
      series
        .map((s, i) => ({ i, total: s.average ? -1 : seriesTotal(s) }))
        .sort((a, b) => b.total - a.total)
        .map((x) => x.i),
    [series]
  );
  const [barChoice, setBarIndex] = useState<number | undefined>();
  const [lineChoice, setLineIndex] = useState<number | undefined>();
  const barIndex = barChoice ?? ranked[0] ?? -1;
  const lineIndex = lineChoice ?? ranked[1] ?? -1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-[64px]">
        <LoadingComponent />
      </div>
    );
  }

  if (!series.length && !totals.length) {
    return <EmptyState integration={integration} />;
  }

  const breakdown = totals.filter((x) => !x.average && x.value > 0);

  return (
    <div className="flex flex-col gap-[20px]">
      <section
        aria-label={t('paragon_analytics_metrics', 'Metrics')}
        className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-[14px]"
      >
        {series.map((s) => (
          <div
            key={s.label}
            onPointerMove={spot}
            className="paragon-spot bg-white border border-[#eceef1] rounded-[16px] px-[18px] pt-[16px] pb-[12px] flex flex-col gap-[6px]"
          >
            <div className="flex items-center justify-between gap-[8px]">
              <span className="text-[13px] text-[#5d616a] truncate">{s.label}</span>
              <TrendBadge trend={seriesTrend(s)} />
            </div>
            <span className="font-heading font-[600] text-[26px] -tracking-[0.5px] text-[#111214]">
              {formatNumber(seriesTotal(s), s.average)}
            </span>
            <Sparkline values={s.points.map((p) => p.value)} color={color} />
          </div>
        ))}
        {totals.map((s) => (
          <div
            key={s.label}
            onPointerMove={spot}
            className="paragon-spot bg-white border border-[#eceef1] rounded-[16px] px-[18px] py-[16px] flex flex-col gap-[6px]"
          >
            <span className="text-[13px] text-[#5d616a] truncate">{s.label}</span>
            <span className="font-heading font-[600] text-[26px] -tracking-[0.5px] text-[#111214]">
              {formatNumber(s.value, s.average)}
            </span>
            <span className="text-[12px] text-[#8a8e96]">
              {t('paragon_analytics_period_total', 'Total for the period')}
            </span>
          </div>
        ))}
      </section>

      {(!!series.length || !!breakdown.length) && (
        <section
          className={clsx(
            'grid gap-[16px]',
            series.length && breakdown.length
              ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)] tablet:grid-cols-1'
              : 'grid-cols-1'
          )}
        >
          {!!series.length && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <CardTitle
                  title={t('paragon_analytics_daily', 'Daily performance')}
                  subtitle={t(
                    'paragon_analytics_daily_hint',
                    'Combine two metrics: one as bars and one as a line, each with its own scale'
                  )}
                />
                <div className="flex flex-wrap gap-[8px]">
                  <SeriesSelect
                    label={t('paragon_analytics_bars', 'Bars')}
                    color={color}
                    value={barIndex}
                    options={series}
                    onChange={setBarIndex}
                  />
                  {series.length > 1 && (
                    <SeriesSelect
                      label={t('paragon_analytics_line', 'Line')}
                      color="#111214"
                      value={lineIndex}
                      options={series}
                      onChange={setLineIndex}
                    />
                  )}
                </div>
              </div>
              <ComboChart
                bars={series[barIndex]}
                line={series[lineIndex]}
                barColor={color}
                lineColor="#111214"
              />
            </Card>
          )}
          {!!breakdown.length && (
            <Card>
              <CardTitle
                title={t('paragon_analytics_breakdown', 'Breakdown')}
                subtitle={t(
                  'paragon_analytics_breakdown_hint',
                  'Totals for the period, from highest to lowest'
                )}
              />
              <BreakdownBars items={breakdown} colors={BREAKDOWN_COLORS} />
            </Card>
          )}
        </section>
      )}
      <PostsInsights integrationId={integration.id} days={date} />
    </div>
  );
};

export const ChannelSummaryCard: FC<{
  integration: Integration & { identifier?: string };
  date: number;
  onOpen: () => void;
}> = ({ integration, date, onOpen }) => {
  const t = useT();
  const { data, isLoading } = useChannelAnalytics(integration?.id, date);
  const { series, totals } = useMemo(() => splitAnalytics(data), [data]);
  const identifier = integration.identifier || integration.providerIdentifier;
  const color = PARAGON_NETWORK_COLORS[identifier] || '#f93b4f';
  const main = useMemo(
    () =>
      [...series]
        .filter((s) => !s.average)
        .sort((a, b) => seriesTotal(b) - seriesTotal(a))[0],
    [series]
  );
  const metrics = useMemo(
    () =>
      [
        ...series.map((s) => ({ label: s.label, value: seriesTotal(s), average: s.average })),
        ...totals,
      ].slice(0, 4),
    [series, totals]
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerMove={spot}
      className="paragon-spot text-start bg-white border border-[#eceef1] rounded-[20px] p-[20px] flex flex-col gap-[14px] min-w-0 cursor-pointer"
    >
      <div className="flex items-center gap-[12px] w-full">
        <ImageWithFallback
          fallbackSrc={`/icons/platforms/${identifier}.png`}
          src={integration.picture || `/icons/platforms/${identifier}.png`}
          className="rounded-[10px] shrink-0"
          alt=""
          width={40}
          height={40}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-[600] text-[15px] text-[#111214] truncate">{integration.name}</span>
          <span className="flex items-center gap-[6px] text-[12px] text-[#5d616a]">
            <span className="w-[8px] h-[8px] rounded-full" style={{ background: color }} />
            {networkName(identifier)}
          </span>
        </div>
        <span className="text-[13px] font-[500] text-[#5d616a]">
          {t('paragon_analytics_open', 'View details')} ›
        </span>
      </div>
      {isLoading ? (
        <div className="h-[120px] flex items-center justify-center">
          <LoadingComponent />
        </div>
      ) : !metrics.length ? (
        <div className="h-[120px] flex items-center justify-center text-[13px] text-[#8a8e96]">
          {t('paragon_analytics_no_data', 'No data for this period')}
        </div>
      ) : (
        <>
          {!!main && (
            <div className="flex flex-col gap-[4px] w-full">
              <span className="text-[12px] text-[#5d616a]">{main.label}</span>
              <Sparkline values={main.points.map((p) => p.value)} color={color} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px] w-full">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col min-w-0">
                <span className="text-[12px] text-[#5d616a] truncate">{m.label}</span>
                <span className="font-heading font-[600] text-[18px] text-[#111214]">
                  {formatNumber(m.value, m.average)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </button>
  );
};
