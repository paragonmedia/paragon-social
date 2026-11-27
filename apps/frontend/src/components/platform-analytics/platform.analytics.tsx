'use client';

import useSWR from 'swr';
import { useCallback, useMemo, useState } from 'react';
import { orderBy } from 'lodash';
import clsx from 'clsx';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  ChannelSummaryCard,
  RenderAnalytics,
} from '@gitroom/frontend/components/platform-analytics/render.analytics';
import { useRouter } from 'next/navigation';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import {
  networkName,
  PARAGON_NETWORK_COLORS,
} from '@gitroom/frontend/components/new-layout/paragon.sidebar';
const allowedIntegrations = [
  'facebook',
  'instagram',
  'instagram-standalone',
  'linkedin-page',
  'tiktok',
  'tiktok-business',
  'youtube',
  'gmb',
  'pinterest',
  'threads',
  'x',
];
// Paragon Social: periods each network can return (same lists as before)
const DAYS_7_30 = [
  'facebook',
  'instagram',
  'instagram-standalone',
  'linkedin-page',
  'pinterest',
  'youtube',
  'threads',
  'gmb',
  'x',
  'tiktok',
  'tiktok-business',
];
const DAYS_90 = ['facebook', 'linkedin-page', 'pinterest', 'youtube', 'x', 'gmb'];
const periodsFor = (identifier?: string) => {
  if (!identifier) return [7, 30];
  const list: number[] = [];
  if (DAYS_7_30.includes(identifier)) list.push(7, 30);
  if (DAYS_90.includes(identifier)) list.push(90);
  return list;
};
const PILL = 84;
const SUMMARY = 'summary';

export const PlatformAnalytics = () => {
  const fetch = useFetch();
  const t = useT();
  const router = useRouter();
  const { disableXAnalytics } = useVariables();
  const toaster = useToaster();

  const [selected, setSelected] = useState<string>(SUMMARY);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    const int = (
      await (await fetch('/integrations/list')).json()
    ).integrations.filter((f: any) => {
      if (f.identifier === 'x' && disableXAnalytics) {
        return false;
      }
      return true;
    });
    return int.filter((f: any) => allowedIntegrations.includes(f.identifier));
  }, []);
  const { data, isLoading } = useSWR('analytics-list', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    fallbackData: [],
  });
  const sortedIntegrations = useMemo(() => {
    return orderBy(
      (data || []).filter((p: any) => !p.disabled),
      ['type', 'identifier', 'name'],
      ['desc', 'asc', 'asc']
    );
  }, [data]);
  const currentIntegration = useMemo(
    () => sortedIntegrations.find((p: any) => p.id === selected),
    [selected, sortedIntegrations]
  );

  const periods = useMemo(
    () => periodsFor(currentIntegration?.identifier),
    [currentIntegration]
  );
  const activeDays = periods.includes(days) ? days : periods[periods.length - 1];
  const summaryDays = (identifier: string) => {
    const list = periodsFor(identifier);
    return list.includes(activeDays) ? activeDays : list[list.length - 1];
  };

  const open = useCallback(
    (integration: any) => () => {
      if (integration.refreshNeeded) {
        toaster.show(
          t(
            'paragon_analytics_reconnect',
            'Please reconnect the channel from the calendar'
          ),
          'warning'
        );
        return;
      }
      setSelected(integration.id);
    },
    [t, toaster]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-[32px]">
        <LoadingComponent />
      </div>
    );
  }

  if (!sortedIntegrations.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center gap-[12px] p-[32px]">
        <h1 className="m-0 font-heading text-[30px] font-[700] -tracking-[0.6px] text-[#111214]">
          {t('can_t_show_analytics_yet', "Can't show analytics yet")}
        </h1>
        <p className="m-0 text-[15px] text-[#5d616a]">
          {t(
            'you_have_to_add_social_media_channels',
            'You have to add Social Media channels'
          )}
        </p>
        <button
          type="button"
          onClick={() => router.push('/launches?channels=open')}
          className="h-[44px] px-[20px] rounded-[12px] bg-[#f93b4f] hover:bg-[#e2283c] text-white text-[14px] font-[600]"
        >
          {t('paragon_connect_channel', 'Connect channel')}
        </button>
      </div>
    );
  }

  const periodLabel = (d: number) =>
    d === 7
      ? t('7_days', '7 Days')
      : d === 30
      ? t('30_days', '30 Days')
      : t('90_days', '90 Days');
  const pillIndex = Math.max(0, periods.indexOf(activeDays));

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-[20px] px-[32px] pt-[28px] pb-[48px] mobile:px-[16px] mobile:pt-[16px]">
      <header className="flex flex-wrap items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[14px] min-w-0">
          {!!currentIntegration && (
            <ImageWithFallback
              fallbackSrc={`/icons/platforms/${currentIntegration.identifier}.png`}
              src={
                currentIntegration.picture ||
                `/icons/platforms/${currentIntegration.identifier}.png`
              }
              className="rounded-[14px] shrink-0"
              alt=""
              width={48}
              height={48}
            />
          )}
          <div className="flex flex-col gap-[4px] min-w-0">
            <h1 className="m-0 font-heading text-[30px] mobile:text-[24px] font-[700] -tracking-[0.6px] text-[#111214] truncate">
              {currentIntegration
                ? currentIntegration.name
                : t('analytics', 'Analytics')}
            </h1>
            <p className="m-0 text-[14px] text-[#5d616a]">
              {currentIntegration
                ? networkName(currentIntegration.identifier)
                : t('paragon_analytics_all_channels', 'All channels')}
              {' · '}
              {t('paragon_analytics_last_days', 'Last {{days}} days', {
                days: activeDays,
              })}
            </p>
          </div>
        </div>
        {periods.length > 1 && (
          <div
            role="group"
            aria-label={t('paragon_analytics_period', 'Period')}
            className="relative flex p-[4px] bg-[#eceef1] rounded-[12px]"
          >
            <div
              aria-hidden="true"
              className="absolute top-[4px] start-[4px] h-[36px] rounded-[9px] bg-white shadow-[0_1px_3px_rgba(17,18,20,.12)] transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(.3,1.4,.5,1)]"
              style={{ width: PILL, transform: `translateX(${pillIndex * PILL}px)` }}
            />
            {periods.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={clsx(
                  'relative h-[36px] rounded-[9px] text-[13px] transition-colors',
                  activeDays === d
                    ? 'text-[#111214] font-[600]'
                    : 'text-[#5d616a] font-[500]'
                )}
                style={{ width: PILL }}
              >
                {periodLabel(d)}
              </button>
            ))}
          </div>
        )}
      </header>

      <nav
        aria-label={t('channels', 'Channels')}
        className="flex gap-[8px] overflow-x-auto pb-[2px] -mx-[2px] px-[2px]"
      >
        {[{ id: SUMMARY } as any, ...sortedIntegrations].map((integration: any) => {
          const active = selected === integration.id;
          const summary = integration.id === SUMMARY;
          return (
            <button
              key={integration.id}
              type="button"
              aria-pressed={active}
              onClick={summary ? () => setSelected(SUMMARY) : open(integration)}
              className={clsx(
                'flex-none inline-flex items-center gap-[8px] h-[40px] px-[12px] rounded-[12px] border text-[13px] font-[500] transition-colors',
                active
                  ? 'bg-[#111214] border-[#111214] text-white'
                  : 'bg-white border-[#dfe1e5] text-[#111214] hover:bg-[#f6f7f8]',
                integration.refreshNeeded && 'opacity-60'
              )}
            >
              {summary ? (
                <span
                  className={clsx(
                    'w-[8px] h-[8px] rounded-full',
                    active ? 'bg-[#f93b4f]' : 'bg-[#5d616a]'
                  )}
                />
              ) : (
                <span className="relative">
                  <ImageWithFallback
                    fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
                    src={
                      integration.picture ||
                      `/icons/platforms/${integration.identifier}.png`
                    }
                    className="rounded-[6px]"
                    alt=""
                    width={22}
                    height={22}
                  />
                  <span
                    className="absolute -bottom-[2px] -end-[2px] w-[9px] h-[9px] rounded-full border-[2px]"
                    style={{
                      background:
                        PARAGON_NETWORK_COLORS[integration.identifier] || '#5d616a',
                      borderColor: active ? '#111214' : '#ffffff',
                    }}
                  />
                </span>
              )}
              <span className="max-w-[180px] truncate">
                {summary ? t('paragon_analytics_summary', 'Summary') : integration.name}
              </span>
            </button>
          );
        })}
      </nav>

      {currentIntegration ? (
        <RenderAnalytics
          key={`${currentIntegration.id}-${activeDays}`}
          integration={currentIntegration}
          date={activeDays}
        />
      ) : (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[16px]">
          {sortedIntegrations.map((integration: any) => (
            <ChannelSummaryCard
              key={`${integration.id}-${summaryDays(integration.identifier)}`}
              integration={integration}
              date={summaryDays(integration.identifier)}
              onOpen={open(integration)}
            />
          ))}
        </section>
      )}
    </div>
  );
};
