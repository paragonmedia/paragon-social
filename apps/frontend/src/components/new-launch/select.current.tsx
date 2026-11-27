'use client';

import { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  SelectedIntegrations,
  useLaunchStore,
} from '@gitroom/frontend/components/new-launch/store';
import clsx from 'clsx';
import SafeImage from '@gitroom/react/helpers/safe.image';
import {
  isBrandMark,
  PlatformIcon,
} from '@gitroom/frontend/components/ui/platform.icon.component';
import { useShallow } from 'zustand/react/shallow';
import {
  networkName,
  PARAGON_NETWORK_COLORS,
} from '@gitroom/frontend/components/new-layout/paragon.sidebar';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';
import { useExistingData } from '@gitroom/frontend/components/launches/helpers/use.existing.data';
import {
  useDecisionModal,
  useModals,
} from '@gitroom/frontend/components/layout/new-modal';

export function useHasScroll(ref: RefObject<HTMLElement | null>): boolean {
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const checkScroll = () => {
      const el = ref.current;
      if (el) {
        setHasHorizontalScroll(el.scrollWidth > el.clientWidth);
      }
    };

    checkScroll(); // initial check

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(ref.current);

    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(ref.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref]);

  return hasHorizontalScroll;
}

export const SelectCurrent: FC = () => {
  const t = useT();
  const modals = useDecisionModal();
  const existingData = useExistingData();
  const {
    selectedIntegrations,
    current,
    setCurrent,
    locked,
    setHide,
    addOrRemoveSelectedIntegration,
  } = useLaunchStore(
    useShallow((state) => ({
      selectedIntegrations: state.selectedIntegrations,
      addOrRemoveSelectedIntegration: state.addOrRemoveSelectedIntegration,
      current: state.current,
      setCurrent: state.setCurrent,
      locked: state.locked,
      setHide: state.setHide,
    }))
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const hasScroll = useHasScroll(contentRef);

  const removeSocial = useCallback(
    (sIntegration: Integrations) => async (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      const open = await modals.open({
        title: 'Remove Social Account',
        description:
          'Are you sure you want to remove this social from scheduling?',
      });

      if (!open) {
        return;
      }

      addOrRemoveSelectedIntegration(sIntegration, {});
    },
    []
  );

  return (
    <>
      <div className="select-none left-0 absolute w-full z-[100] px-[20px] mobile:static mobile:px-0">
        <div
          ref={contentRef}
          className={clsx(
            'flex items-center gap-[8px] mobile:gap-[4px] w-full overflow-x-auto pt-[8px] pe-[8px] scrollbar scrollbar-thumb-tableBorder scrollbar-track-secondary mobile:scrollbar-none',
            locked && 'pointer-events-none'
          )}
        >
          {/* an existing post opens on its channels, without the global mode */}
          {/* Paragon Social: the text tabs, "all channels" or one channel */}
          <span className="shrink-0 text-[13px] font-[600] text-[#111214] me-[4px] mobile:hidden">
            {t('paragon_text_for', 'Text for')}
          </span>
          {!existingData.integration && (
            <button
              type="button"
              onClick={() => {
                setHide(true);
                setCurrent('global');
              }}
              data-tooltip-id="tooltip"
              data-tooltip-content={t(
                'paragon_text_all_hint',
                'The same text goes to every selected channel'
              )}
              className={clsx(
                'shrink-0 flex items-center gap-[8px] h-[40px] px-[14px] rounded-full border text-[13px] transition-colors mobile:h-[44px]',
                current === 'global'
                  ? 'bg-white border-[#111214] text-[#111214] font-[600] shadow-[inset_0_0_0_1px_#111214]'
                  : 'bg-[#f6f7f8] border-[#eceef1] text-[#5d616a] font-[500] hover:bg-white',
                locked && 'opacity-50'
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 2 10 5-10 5L2 7z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
              {t('paragon_text_all', 'All channels')}
            </button>
          )}
          {/* a locked tab is dimmed, a brand mark can't be: only its avatar is
              (see isBrandMark). It is also bigger than the avatar of a tab, so
              it sits next to it, in a wider tab */}
          {selectedIntegrations.map(({ integration }) => (
            <div
              onClick={() => {
                setHide(true);
                setCurrent(integration.id);
              }}
              key={integration.id}
              className={clsx(
                'group/tab shrink-0 border cursor-pointer relative flex gap-[8px] h-[40px] mobile:h-[44px] rounded-full items-center ps-[5px] pe-[14px] text-[13px] transition-colors',
                !isBrandMark(integration.identifier) && locked && 'opacity-50',
                current === integration.id
                  ? 'bg-white border-[#111214] text-[#111214] font-[600] shadow-[inset_0_0_0_1px_#111214]'
                  : 'bg-[#f6f7f8] border-[#eceef1] text-[#5d616a] font-[500] hover:bg-white'
              )}
            >
              {/* an existing post keeps its channels, each with its own content */}
              {!existingData.integration && (
                <>
                  <button
                    type="button"
                    onClick={removeSocial(integration)}
                    aria-label={t('paragon_remove_channel', 'Remove channel')}
                    data-tooltip-id="tooltip"
                    data-tooltip-content={t('paragon_remove_channel', 'Remove channel')}
                    className="absolute z-20 -top-[7px] -end-[7px] w-[20px] h-[20px] rounded-full bg-[#111214] text-white flex items-center justify-center border-[2px] border-white shadow-[0_2px_6px_rgba(17,18,20,.25)] hover:scale-110 transition-transform mobile:hidden"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                  <IsGlobal id={integration.id} />
                </>
              )}
              <div
                {...{
                  'data-tooltip-id': 'tooltip',
                  'data-tooltip-content': integration.name,
                }}
                className={clsx(
                  'relative h-full rounded-full flex items-center gap-[8px] filter transition-all duration-500'
                )}
              >
                <SafeImage
                  src={integration.picture || '/no-picture.jpg'}
                  className={clsx(
                    'rounded-full min-w-[28px] w-[28px] h-[28px] object-cover',
                    isBrandMark(integration.identifier) &&
                      locked &&
                      'opacity-50'
                  )}
                  alt={integration.identifier}
                  width={28}
                  height={28}
                  onError={(e) => {
                    e.currentTarget.src = '/no-picture.jpg';
                    e.currentTarget.srcset = '/no-picture.jpg';
                  }}
                />
                <span
                  className="absolute start-[20px] bottom-[4px] w-[10px] h-[10px] rounded-full border-[2px] border-white"
                  style={{
                    background:
                      PARAGON_NETWORK_COLORS[integration.identifier] || '#5d616a',
                  }}
                />
                <span className="whitespace-nowrap">
                  {integration.name} · {networkName(integration.identifier)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className={clsx(hasScroll ? 'h-[63px]' : 'h-[48px]', 'mobile:hidden')}
      />
    </>
  );
};

export const IsGlobal: FC<{ id: string }> = ({ id }) => {
  const t = useT();
  const { isInternal } = useLaunchStore(
    useShallow((state) => ({
      isInternal: !!state.internal.find((p) => p.integration.id === id),
    }))
  );

  if (!isInternal) {
    return null;
  }

  return (
    <div
      data-tooltip-id="tooltip"
      data-tooltip-content={t(
        'no_longer_global_mode',
        'No longer in global mode'
      )}
      className="w-[10px] h-[10px] bg-[#f93b4f] border-[2px] border-white -top-[2px] start-[2px] absolute rounded-full z-10"
    />
  );
};
