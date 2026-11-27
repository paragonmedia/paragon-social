'use client';

import React, { FC, useCallback } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { spot } from '@gitroom/frontend/components/ui/paragon.spot';
import { useChangeSpace } from '@gitroom/frontend/components/new-layout/paragon.sidebar';

// Paragon Social: every client space at a glance, with this week's numbers

interface SpaceSummary {
  id: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  channels: number;
  scheduled: number;
  drafts: number;
  published: number;
  errors: number;
}

const useSpacesOverview = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/user/organizations/overview')).json();
  }, []);
  return useSWR<SpaceSummary[]>('spaces-overview', load, {
    revalidateOnFocus: false,
  });
};

const initials = (name: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const ParagonSpacesOverview: FC = () => {
  const t = useT();
  const user = useUser();
  const { data, isLoading } = useSpacesOverview();
  const changeSpace = useChangeSpace();

  const roleLabel = (role: SpaceSummary['role']) =>
    role === 'USER'
      ? t('user', 'User')
      : role === 'ADMIN'
      ? t('admin', 'Admin')
      : t('paragon_space_owner', 'Owner');

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-[24px] px-[32px] pt-[28px] pb-[48px] mobile:px-[16px] mobile:pt-[16px]">
      <header className="flex flex-wrap items-center justify-between gap-[16px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 font-heading text-[30px] mobile:text-[24px] font-[700] -tracking-[0.6px] text-[#111214]">
            {t('paragon_spaces_title', 'Spaces')}
          </h1>
          <p className="m-0 text-[14px] text-[#5d616a]">
            {t(
              'paragon_spaces_subtitle',
              'One space per client · numbers for this week'
            )}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-[64px]">
          <LoadingComponent />
        </div>
      ) : (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[16px]">
          {(data || []).map((space) => {
            const current = space.id === user?.orgId;
            return (
              <div
                key={space.id}
                onPointerMove={spot}
                className={clsx(
                  'paragon-spot bg-white border rounded-[20px] p-[20px] flex flex-col gap-[18px]',
                  current ? 'border-[#111214]' : 'border-[#eceef1]'
                )}
              >
                <div className="flex items-center gap-[12px]">
                  <span className="w-[44px] h-[44px] rounded-[12px] bg-[#111214] text-white flex items-center justify-center font-heading font-[700] text-[15px]">
                    {initials(space.name)}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-heading font-[600] text-[17px] text-[#111214] truncate">
                      {space.name}
                    </span>
                    <span className="text-[12px] text-[#5d616a]">
                      {roleLabel(space.role)} · {space.channels}{' '}
                      {t('paragon_spaces_channels', 'channels')}
                    </span>
                  </div>
                  {current && (
                    <span className="px-[10px] py-[4px] rounded-full bg-[#eceef1] text-[11px] font-[600] text-[#50555e]">
                      {t('paragon_spaces_current', 'Current')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-[8px]">
                  {[
                    [t('paragon_stat_scheduled', 'Scheduled'), space.scheduled],
                    [t('paragon_stat_drafts', 'Drafts'), space.drafts],
                    [t('paragon_stat_published', 'Published'), space.published],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="rounded-[12px] bg-[#f6f7f8] px-[12px] py-[10px] flex flex-col gap-[2px]"
                    >
                      <span className="text-[11.5px] text-[#5d616a]">{label}</span>
                      <span className="font-heading font-[600] text-[20px] text-[#111214]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                {space.errors > 0 && (
                  <span className="text-[12.5px] font-[500] text-[#b42234]">
                    {space.errors} {t('paragon_spaces_errors', 'posts with errors this week')}
                  </span>
                )}
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => changeSpace(space.id, '/launches')}
                    className="flex-1 h-[40px] rounded-[10px] bg-[#111214] hover:bg-[#2a2c31] text-white text-[13px] font-[600]"
                  >
                    {t('paragon_spaces_calendar', 'Open calendar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSpace(space.id, '/analytics')}
                    className="flex-1 h-[40px] rounded-[10px] border border-[#dfe1e5] bg-white hover:bg-[#f6f7f8] text-[#111214] text-[13px] font-[600]"
                  >
                    {t('analytics', 'Analytics')}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
