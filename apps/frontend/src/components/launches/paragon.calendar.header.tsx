'use client';

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { getDateRange } from '@gitroom/frontend/components/launches/filters';
import { useCreatePost } from '@gitroom/frontend/components/launches/new.post';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { SelectCustomer } from '@gitroom/frontend/components/launches/select.customer';
import { SelectChannels } from '@gitroom/frontend/components/launches/select.channels';
import { spot } from '@gitroom/frontend/components/ui/paragon.spot';

// Paragon Social: calendar header and summary cards, built from the
// "Main" screen of the Claude Design redesign.

type Display = 'day' | 'week' | 'month' | 'list';
const VIEWS: Display[] = ['day', 'week', 'month', 'list'];
const PILL = 72;

const timezoneCity = () => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return zone.split('/').pop()?.replace(/_/g, ' ') || '';
  } catch {
    return '';
  }
};

export const ParagonCalendarHeader: FC = () => {
  const calendar = useCalendar();
  const t = useT();
  const createPost = useCreatePost();
  const display = calendar.display as Display;
  const searchParams = useSearchParams();
  const router = useRouter();
  const opened = useRef(false);

  // "Crear" in the sidebar links to /launches?create=1
  useEffect(() => {
    if (
      searchParams.get('create') !== '1' ||
      opened.current ||
      !calendar.integrations.length
    ) {
      return;
    }
    opened.current = true;
    router.replace('/launches');
    createPost();
  }, [searchParams, calendar.integrations, createPost]);

  const setRange = useCallback(
    (view: Display, reference?: string) => {
      const range = getDateRange(view, reference);
      calendar.setFilters({
        startDate: range.startDate,
        endDate: range.endDate,
        display: view,
        customer: calendar.customer,
      } as any);
    },
    [calendar]
  );

  const move = useCallback(
    (direction: 1 | -1) => () => {
      if (display === 'list') return;
      const unit = display === 'day' ? 'day' : display === 'month' ? 'month' : 'week';
      const start = newDayjs(calendar.startDate).add(direction, unit);
      setRange(display, start.format('YYYY-MM-DD'));
    },
    [calendar, display, setRange]
  );

  const subtitle = useMemo(() => {
    const start = newDayjs(calendar.startDate);
    const end = newDayjs(calendar.endDate);
    let text = '';
    if (display === 'day') {
      text = start.format('dddd D [de] MMMM, YYYY');
    } else if (display === 'month') {
      text = start.format('MMMM YYYY');
    } else if (display === 'week') {
      text = start.isSame(end, 'month')
        ? `${start.format('D')} – ${end.format('D [de] MMMM, YYYY')}`
        : `${start.format('D [de] MMM')} – ${end.format('D [de] MMM, YYYY')}`;
    } else {
      text = t('paragon_list_subtitle', 'All your posts in a list');
    }
    const city = timezoneCity();
    return city
      ? `${text} · ${t('paragon_timezone_of', 'Time in')} ${city}`
      : text;
  }, [calendar.startDate, calendar.endDate, display]);

  const labels: Record<Display, string> = {
    day: t('day', 'Day'),
    week: t('week', 'Week'),
    month: t('month', 'Month'),
    list: t('list', 'List'),
  };
  const index = Math.max(0, VIEWS.indexOf(display));

  return (
    <header className="flex flex-wrap items-center gap-[16px] justify-between">
      <div className="flex flex-col gap-[4px] min-w-0">
        <h1 className="font-heading m-0 text-[30px] mobile:text-[24px] font-[700] -tracking-[0.6px] text-[#111214]">
          {t('calendar', 'Calendar')}
        </h1>
        <p className="m-0 text-[14px] text-[#5d616a] first-letter:uppercase">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-[10px]">
        <div
          role="group"
          aria-label={t('paragon_view', 'View')}
          className="relative flex p-[4px] bg-[#eceef1] rounded-[12px]"
        >
          <div
            aria-hidden="true"
            className="absolute top-[4px] start-[4px] h-[36px] rounded-[9px] bg-white shadow-[0_1px_3px_rgba(17,18,20,.12)] transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(.3,1.4,.5,1)]"
            style={{
              width: PILL,
              transform: `translateX(${index * PILL}px)`,
            }}
          />
          {VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => display !== view && setRange(view)}
              className={clsx(
                'relative h-[36px] rounded-[9px] text-[13px] transition-colors',
                display === view
                  ? 'text-[#111214] font-[600]'
                  : 'text-[#5d616a] font-[500]'
              )}
              style={{ width: PILL }}
            >
              {labels[view]}
            </button>
          ))}
        </div>
        {display !== 'list' && (
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={move(-1)}
              aria-label={t('paragon_previous', 'Previous')}
              className="w-[44px] h-[44px] rounded-[12px] border border-[#dfe1e5] bg-white text-[#111214] text-[18px] hover:bg-[#f6f7f8] rtl:rotate-180"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setRange(display)}
              className="h-[44px] px-[16px] rounded-[12px] border border-[#dfe1e5] bg-white text-[#111214] text-[14px] font-[500] hover:bg-[#f6f7f8]"
            >
              {t('today', 'Today')}
            </button>
            <button
              type="button"
              onClick={move(1)}
              aria-label={t('paragon_next', 'Next')}
              className="w-[44px] h-[44px] rounded-[12px] border border-[#dfe1e5] bg-white text-[#111214] text-[18px] hover:bg-[#f6f7f8] rtl:rotate-180"
            >
              ›
            </button>
          </div>
        )}
        <div className="contents [&>*]:h-[44px]">
          <SelectCustomer
            customer={calendar.customer as string}
            onChange={(customer: string) =>
              calendar.setFilters({
                startDate: calendar.startDate,
                endDate: calendar.endDate,
                display: calendar.display,
                customer,
              } as any)
            }
            integrations={calendar.integrations}
          />
          <SelectChannels />
        </div>
        {calendar.integrations.length > 0 && (
          <button
            type="button"
            onClick={createPost}
            className="inline-flex items-center gap-[8px] h-[44px] px-[20px] rounded-[12px] bg-[#f93b4f] hover:bg-[#e2283c] text-white text-[14px] font-[600] transition-colors mobile:hidden"
          >
            + {t('paragon_new_post', 'New post')}
          </button>
        )}
      </div>
    </header>
  );
};

export const ParagonCalendarStats: FC = () => {
  const calendar = useCalendar();
  const t = useT();

  const stats = useMemo(() => {
    const posts = (calendar.posts || []) as Array<{ state?: string }>;
    const count = (state: string) =>
      posts.filter((p) => p.state === state).length;
    return [
      {
        label: t('paragon_stat_scheduled', 'Scheduled'),
        value: count('QUEUE'),
      },
      { label: t('paragon_stat_drafts', 'Drafts'), value: count('DRAFT') },
      {
        label: t('paragon_stat_published', 'Published'),
        value: count('PUBLISHED'),
      },
      {
        label: t('paragon_stat_channels', 'Connected channels'),
        value: (calendar.integrations || []).filter((p: any) => !p.disabled)
          .length,
      },
    ];
  }, [calendar.posts, calendar.integrations]);

  if (calendar.display === 'list') {
    return null;
  }

  return (
    <section
      aria-label={t('paragon_summary', 'Summary')}
      className="grid grid-cols-4 phone:grid-cols-2 gap-[16px] phone:gap-[10px]"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          onPointerMove={spot}
          className="paragon-spot bg-white border border-[#eceef1] rounded-[16px] px-[20px] py-[18px] phone:px-[14px] phone:py-[12px] flex flex-col gap-[6px] phone:gap-[2px]"
        >
          <span className="text-[13px] text-[#5d616a]">{stat.label}</span>
          <span className="font-heading font-[600] text-[28px] phone:text-[22px] -tracking-[0.56px] text-[#111214]">
            {stat.value}
          </span>
        </div>
      ))}
    </section>
  );
};

