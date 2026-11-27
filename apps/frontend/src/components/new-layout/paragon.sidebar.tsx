'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
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

// Paragon Social: the spaces (organizations) of the user, one per client
export const useOrganizations = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return await (await fetch('/user/organizations')).json();
  }, []);
  return useSWR<Array<{ id: string; name: string }>>('organizations', load, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });
};

export const useChangeSpace = () => {
  const fetch = useFetch();
  return useCallback(async (id: string, path?: string) => {
    await fetch('/user/change-org', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    if (path) {
      window.location.href = path;
      return;
    }
    window.location.reload();
  }, []);
};

const NewSpaceForm: FC = () => {
  const fetch = useFetch();
  const t = useT();
  const toaster = useToaster();
  const changeSpace = useChangeSpace();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim().length < 2 || saving) {
        return;
      }
      setSaving(true);
      const failed = () => {
        setSaving(false);
        toaster.show(
          t('paragon_space_error', 'Could not create the space'),
          'warning'
        );
      };
      try {
        const response = await fetch('/user/organizations', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!response.ok) {
          failed();
          return;
        }
        const space = await response.json();
        await changeSpace(space.id, '/launches');
      } catch {
        failed();
      }
    },
    [name, saving]
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-[16px] w-[420px] max-w-full">
      <p className="m-0 text-[14px] text-[#5d616a] leading-[1.5]">
        {t(
          'paragon_space_new_hint',
          'A space keeps the channels, posts, library and team of one client apart from the others. You will be its owner and can invite the client afterwards.'
        )}
      </p>
      <label className="flex flex-col gap-[6px] text-[13px] font-[600] text-[#111214]">
        {t('paragon_space_name', 'Client or space name')}
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={t('paragon_space_name_placeholder', 'e.g. Puro Pollo')}
          className="h-[44px] px-[14px] rounded-[12px] border border-[#dfe1e5] bg-white text-[14px] font-[400] text-[#111214] outline-none focus:border-[#111214] transition-colors"
        />
      </label>
      <button
        type="submit"
        disabled={name.trim().length < 2 || saving}
        className="h-[44px] rounded-[12px] bg-[#f93b4f] hover:bg-[#e2283c] disabled:opacity-50 text-white text-[14px] font-[600]"
      >
        {saving
          ? t('paragon_space_creating', 'Creating…')
          : t('paragon_space_create', 'Create space')}
      </button>
    </form>
  );
};

const NEW_SPACE = '__new__';
const ALL_SPACES = '__all__';

export const ParagonSpaceSelector: FC = () => {
  const user = useUser();
  const t = useT();
  const modals = useModals();
  const router = useRouter();
  const { data } = useOrganizations();
  const changeSpace = useChangeSpace();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const onChange = useCallback(
    (value: string) => {
      if (value === NEW_SPACE) {
        modals.openModal({
          title: t('paragon_space_new', 'New space'),
          withCloseButton: true,
          children: <NewSpaceForm />,
        });
        return;
      }
      if (value === ALL_SPACES) {
        router.push('/spaces');
        return;
      }
      changeSpace(value);
    },
    [t]
  );

  if (!data?.length) {
    return null;
  }

  return (
    <label className="flex flex-col gap-[6px] px-[8px] text-[11px] tracking-[0.08em] uppercase text-[#9a9ea6]">
      {t('paragon_space', 'Space')}
      <select
        value={user?.orgId}
        onChange={(e) => onChange(e.target.value)}
        className="h-[40px] rounded-[10px] border border-[#2a2d33] bg-[#1b1d21] text-white px-[12px] text-[14px] font-[500] normal-case tracking-normal cursor-pointer"
      >
        {data.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
        {(canCreate || data.length > 1) && (
          <option disabled>──────────</option>
        )}
        {data.length > 1 && (
          <option value={ALL_SPACES}>
            {t('paragon_space_all', 'See all spaces')}
          </option>
        )}
        {canCreate && (
          <option value={NEW_SPACE}>
            + {t('paragon_space_new', 'New space')}
          </option>
        )}
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
              className="w-[28px] h-[28px] min-w-[28px] rounded-full object-cover"
            />
          ) : (
            <span className="w-[28px] h-[28px] min-w-[28px] rounded-full bg-[#2a2d33] flex items-center justify-center text-[11px] font-[600] text-white">
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
        href="/launches?connect=1"
        className="mt-[4px] h-[44px] rounded-[10px] border border-dashed border-[#3a3d44] text-[#c6c9cf] hover:text-white hover:border-[#5a5e66] flex items-center justify-center text-[13px]"
      >
        + {t('paragon_connect_channel', 'Connect channel')}
      </Link>
    </div>
  );
};
