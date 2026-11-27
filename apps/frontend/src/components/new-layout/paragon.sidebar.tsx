'use client';

import React, { FC, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';

// Paragon Social: pieces of the dark sidebar from the design
// ("Espacio" selector and the "Canales" list).

// Paragon Social: network colors and short names of the design's post cards
export const PARAGON_NETWORK_COLORS: Record<string, string> = {
  facebook: '#1f5fd1',
  instagram: '#b5306b',
  'instagram-standalone': '#b5306b',
  linkedin: '#0a66c2',
  'linkedin-page': '#0a66c2',
  tiktok: '#111214',
  x: '#111214',
  threads: '#111214',
  youtube: '#d42a3e',
  pinterest: '#c8232c',
};
const PARAGON_NETWORK_SHORT: Record<string, string> = {
  facebook: 'FB',
  instagram: 'IG',
  'instagram-standalone': 'IG',
  linkedin: 'IN',
  'linkedin-page': 'IN',
  tiktok: 'TT',
  x: 'X',
  youtube: 'YT',
  threads: 'TH',
  pinterest: 'PI',
};
export const paragonNetworkShort = (identifier?: string) =>
  PARAGON_NETWORK_SHORT[identifier || ''] ||
  (identifier || '').slice(0, 2).toUpperCase();

const NETWORK_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  'instagram-standalone': 'Instagram',
  linkedin: 'LinkedIn',
  'linkedin-page': 'LinkedIn',
  tiktok: 'TikTok',
  x: 'X',
  youtube: 'YouTube',
  threads: 'Threads',
  pinterest: 'Pinterest',
  bluesky: 'Bluesky',
  gmb: 'Google',
};

export const networkName = (identifier?: string) =>
  NETWORK_NAMES[identifier || ''] ||
  (identifier || '').charAt(0).toUpperCase() + (identifier || '').slice(1);

const initials = (name: string) =>
  (name || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const ParagonSpaceSelector: FC = () => {
  const fetch = useFetch();
  const user = useUser();
  const t = useT();
  const load = useCallback(async () => {
    return await (await fetch('/user/organizations')).json();
  }, []);
  const { data } = useSWR('organizations', load, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });
  const changeOrg = useCallback(async (id: string) => {
    await fetch('/user/change-org', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    window.location.reload();
  }, []);

  if (!data?.length) {
    return null;
  }

  return (
    <label className="flex flex-col gap-[6px] px-[8px] text-[11px] tracking-[0.08em] uppercase text-[#9a9ea6]">
      {t('paragon_space', 'Space')}
      <select
        value={user?.orgId}
        onChange={(e) => changeOrg(e.target.value)}
        className="h-[40px] rounded-[10px] border border-[#2a2d33] bg-[#1b1d21] text-white px-[12px] text-[14px] font-[500] normal-case tracking-normal cursor-pointer"
      >
        {data.map((org: { id: string; name: string }) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export const ParagonSidebarChannels: FC = () => {
  const t = useT();
  const { data: integrations } = useIntegrationList();
  const list = useMemo(
    () => (integrations || []).filter((p: any) => !p.disabled).slice(0, 6),
    [integrations]
  );

  return (
    <div className="flex flex-col gap-[10px] px-[8px] mobile:hidden">
      <div className="text-[11px] tracking-[0.08em] uppercase text-[#9a9ea6]">
        {t('channels', 'Channels')}
      </div>
      {list.map((integration: any) => (
        <div
          key={integration.id}
          className="flex items-center gap-[10px] text-[13px] text-[#e4e6ea]"
        >
          {integration.picture ? (
            <img
              src={integration.picture}
              alt=""
              className="w-[24px] h-[24px] min-w-[24px] rounded-[7px] object-cover"
            />
          ) : (
            <span className="w-[24px] h-[24px] min-w-[24px] rounded-[7px] bg-[#23262b] flex items-center justify-center text-[10px] font-[600]">
              {initials(integration.name)}
            </span>
          )}
          <span className="flex-1 truncate">{integration.name}</span>
          <span className="text-[11px] text-[#9a9ea6]">
            {networkName(integration.identifier)}
          </span>
        </div>
      ))}
      <Link
        href="/launches?channels=open"
        className="mt-[2px] h-[36px] rounded-[10px] border border-dashed border-[#2f3238] text-[#c6c9cf] hover:text-white hover:border-[#4a4e56] flex items-center justify-center text-[13px]"
      >
        + {t('paragon_connect_channel', 'Connect channel')}
      </Link>
    </div>
  );
};
