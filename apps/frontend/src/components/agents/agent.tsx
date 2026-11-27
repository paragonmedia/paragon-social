'use client';

import React, {
  createContext,
  FC,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import clsx from 'clsx';
import useCookie from 'react-use-cookie';
import useSWR from 'swr';
import { orderBy } from 'lodash';
import { SVGLine } from '@gitroom/frontend/components/launches/launches.component';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import {
  isBrandMark,
  PlatformIcon,
} from '@gitroom/frontend/components/ui/platform.icon.component';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useWaitForClass } from '@gitroom/helpers/utils/use.wait.for.class';
import { MultiMediaComponent } from '@gitroom/frontend/components/media/media.component';
import { Integration } from '@prisma/client';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const MediaPortal: FC<{
  media: { path: string; id: string }[];
  value: string;
  setMedia: (event: {
    target: {
      name: string;
      value?: {
        id: string;
        path: string;
        alt?: string;
        thumbnail?: string;
        thumbnailTimestamp?: number;
      }[];
    };
  }) => void;
}> = ({ media, setMedia, value }) => {
  const waitForClass = useWaitForClass('copilotKitMessages');
  const t = useT();
  if (!waitForClass) return null;
  return (
    <div className="pl-[14px] pr-[24px] whitespace-nowrap editor rm-bg">
      <MultiMediaComponent
        allData={[{ content: value }]}
        text={value}
        label={t('attachments', 'Attachments')}
        description=""
        value={media}
        dummy={false}
        name="image"
        onChange={setMedia}
        onOpen={() => {}}
        onClose={() => {}}
      />
    </div>
  );
};

export const AgentList: FC<{ onChange: (arr: any[]) => void }> = ({
  onChange,
}) => {
  const fetch = useFetch();
  const t = useT();
  const [selected, setSelected] = useState([]);

  const load = useCallback(async () => {
    return (await (await fetch('/integrations/list')).json()).integrations;
  }, []);

  const [collapseMenu, setCollapseMenu] = useCookie('collapseMenu', '0');

  const { data } = useSWR('integrations', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    fallbackData: [],
  });

  const setIntegration = useCallback(
    (integration: Integration) => () => {
      if (selected.some((p) => p.id === integration.id)) {
        onChange(selected.filter((p) => p.id !== integration.id));
        setSelected(selected.filter((p) => p.id !== integration.id));
      } else {
        onChange([...selected, integration]);
        setSelected([...selected, integration]);
      }
    },
    [selected]
  );

  const sortedIntegrations = useMemo(() => {
    return orderBy(
      data || [],
      ['type', 'disabled', 'identifier'],
      ['desc', 'asc', 'asc']
    );
  }, [data]);

  return (
    <div
      className="flex flex-col gap-[10px] w-full mobile:order-1"
    >
      <div className="flex flex-col gap-[10px]">
        <div className="flex items-center mobile:hidden">
          <h2 className="flex-1 m-0 text-[11px] tracking-[0.08em] uppercase font-[500] text-[#8a8e96] px-[4px]">
            {t('paragon_agent_channels', 'Channels the agent can use')}
          </h2>
          <div className="hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="13"
              viewBox="0 0 7 13"
              fill="none"
            >
              <path
                d="M6 11.5L1 6.5L6 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div
          className={clsx(
            'flex flex-col gap-[4px] mobile:flex-row mobile:gap-[12px] mobile:pt-[6px]'
          )}
        >
          {sortedIntegrations.map((integration, index) => (
            <div
              onClick={setIntegration(integration)}
              key={integration.id}
              className={clsx(
                'flex gap-[10px] items-center group/profile justify-center h-[44px] px-[8px] rounded-[12px] hover:bg-white hover:opacity-100 cursor-pointer text-[14px] text-[#111214] mobile:shrink-0',
                !selected.some((p) => p.id === integration.id) &&
                  !isBrandMark(integration.identifier) &&
                  'opacity-20'
              )}
            >
              {/* a brand mark can't be dimmed with its row: the avatar and the
                  name are instead (see isBrandMark) */}
              <div
                className={clsx(
                  'relative rounded-full flex justify-center items-center gap-[6px]',
                  !isBrandMark(integration.identifier) &&
                    integration.disabled &&
                    'opacity-50'
                )}
              >
                {(integration.inBetweenSteps || integration.refreshNeeded) && (
                  <div className="absolute start-0 top-0 w-[39px] h-[46px] cursor-pointer">
                    <div className="bg-red-500 w-[15px] h-[15px] rounded-full start-0 -top-[5px] absolute z-[200] text-[10px] flex justify-center items-center">
                      !
                    </div>
                    <div className="bg-primary/60 w-[39px] h-[46px] start-0 top-0 absolute rounded-full z-[199]" />
                  </div>
                )}
                <ImageWithFallback
                  fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
                  src={integration.picture}
                  className={clsx(
                    'rounded-full',
                    isBrandMark(integration.identifier) &&
                      (!selected.some((p) => p.id === integration.id)
                        ? 'opacity-20 group-hover/profile:opacity-100'
                        : integration.disabled && 'opacity-50')
                  )}
                  alt={integration.identifier}
                  width={28}
                  height={28}
                />
                {/* a brand mark stays above the reconnect overlay (z-[199]),
                    it hangs a little off the corner to hide less of the
                    picture, and in a faded row it only shows with the hover */}
                <PlatformIcon
                  identifier={integration.identifier}
                  size={18.41}
                  inactive={integration.disabled}
                  className="absolute bottom-[5px] -end-[5px]"
                  iconClassName="z-10 rounded-[8px] border border-fifth"
                  markClassName={clsx(
                    'z-[201] -mb-[5px] -me-[3px] bg-newBgColorInner group-hover/profile:bg-boxHover',
                    !selected.some((p) => p.id === integration.id) &&
                      'hidden group-hover/profile:flex'
                  )}
                />
              </div>
              <div
                className={clsx(
                  'flex-1 whitespace-nowrap text-ellipsis overflow-hidden mobile:hidden',
                  !selected.some((p) => p.id === integration.id) &&
                    isBrandMark(integration.identifier)
                    ? 'opacity-20 group-hover/profile:opacity-100'
                    : integration.disabled && 'opacity-50'
                )}
              >
                {integration.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PropertiesContext = createContext({ properties: [] });
export const Agent: FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const t = useT();

  return (
    <PropertiesContext.Provider value={{ properties }}>
      {/* Paragon Social: "Agente IA" screen of the design */}
      <div className="flex-1 min-w-0 flex flex-col gap-[24px] px-[32px] pt-[28px] pb-[32px] h-screen mobile:h-auto mobile:px-[16px] mobile:pt-[16px]">
        <header className="flex flex-wrap items-center justify-between gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="m-0 font-heading text-[30px] mobile:text-[24px] font-[700] -tracking-[0.6px] text-[#111214]">
              {t('paragon_menu_agent', 'AI agent')}
            </h1>
            <p className="m-0 text-[14px] text-[#5d616a]">
              {t(
                'paragon_agent_subtitle',
                'Ask it for ideas, copy or to schedule posts for you.'
              )}
            </p>
          </div>
          <Link
            href="/agents"
            className="h-[44px] px-[16px] rounded-[12px] border border-[#dfe1e5] bg-white hover:bg-[#f6f7f8] text-[14px] font-[500] text-[#111214] flex items-center"
          >
            + {t('paragon_agent_new', 'New conversation')}
          </Link>
        </header>
        <div className="flex gap-[20px] flex-1 min-h-0 mobile:flex-col">
          <aside className="w-[260px] shrink-0 flex flex-col gap-[24px] overflow-y-auto mobile:w-full">
            <Threads />
            <AgentList onChange={setProperties} />
          </aside>
          <section className="agent-card flex flex-1 min-w-0 bg-white border border-[#eceef1] rounded-[20px] overflow-hidden mobile:min-h-[500px]">
            {children}
          </section>
        </div>
      </div>
    </PropertiesContext.Provider>
  );
};

const Threads: FC = () => {
  const fetch = useFetch();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const threads = useCallback(async () => {
    return (await fetch('/copilot/list')).json();
  }, []);
  const { id } = useParams<{ id: string }>();

  const { data } = useSWR('threads', threads);

  return (
    <div className="flex flex-col gap-[6px] mobile:order-2">
      <div>
        <h2 className="m-0 mb-[4px] text-[11px] tracking-[0.08em] uppercase font-[500] text-[#8a8e96] px-[4px]">
          {t('paragon_agent_threads', 'Conversations')}
        </h2>
        <div className="flex flex-col gap-[4px] mobile:flex-row mobile:gap-[4px]">
          {data?.threads?.map((p: any) => (
            <Link
              className={clsx(
                'overflow-ellipsis overflow-hidden whitespace-nowrap px-[14px] py-[12px] rounded-[12px] text-[14px] font-[500] text-[#111214] border cursor-pointer mobile:shrink-0 mobile:max-w-[180px]',
                p.id === id
                  ? 'bg-white border-[#dfe1e5]'
                  : 'border-transparent hover:bg-white'
              )}
              href={`/agents/${p.id}`}
              key={p.id}
            >
              {p.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
