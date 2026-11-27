'use client';

import { FC } from 'react';
import clsx from 'clsx';
import { useLaunchStore } from '@gitroom/frontend/components/new-launch/store';
import { useShallow } from 'zustand/react/shallow';
import { useExistingData } from '@gitroom/frontend/components/launches/helpers/use.existing.data';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { Check } from '@gitroom/frontend/components/launches/tags.component';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';
import {
  networkName,
  PARAGON_NETWORK_COLORS,
} from '@gitroom/frontend/components/new-layout/paragon.sidebar';
import {
  isBrandMark,
  PlatformIcon,
} from '@gitroom/frontend/components/ui/platform.icon.component';

const PlatformBadge: FC<{ integration: Integrations; inactive?: boolean }> = ({
  integration,
  inactive,
}) => {
  return (
    <PlatformIcon
      identifier={integration.identifier}
      size={16}
      inactive={inactive}
      className="absolute z-10 bottom-0 -end-[5px]"
      iconClassName="rounded-[4px] min-w-[16px] min-h-[16px]"
      // a brand mark hangs a little off the corner, to hide less of the picture
      markClassName="-mb-[4px] -me-[4px] bg-newBgColorInner"
    />
  );
};

// a channel row with a checkbox, for the phone sheets
export const IntegrationListRow: FC<{
  integration: Integrations;
  selected: boolean;
  onClick: () => void;
  dimmed?: boolean;
}> = ({ integration, selected, onClick, dimmed }) => {
  // a brand mark can't be dimmed with its row (see isBrandMark)
  const dimParts =
    isBrandMark(integration.identifier) && dimmed && 'opacity-50';
  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center gap-[12px] py-[8px] cursor-pointer select-none',
        !isBrandMark(integration.identifier) && dimmed && 'opacity-50'
      )}
    >
      <div className="relative">
        <ImageWithFallback
          fallbackSrc="/no-picture.jpg"
          src={integration.picture || '/no-picture.jpg'}
          className={clsx('rounded-[8px] min-w-[40px] min-h-[40px]', dimParts)}
          alt={integration.identifier}
          width={40}
          height={40}
        />
        <PlatformBadge integration={integration} inactive={dimmed} />
      </div>
      <div
        className={clsx(
          'flex-1 min-w-0 truncate text-[14px] font-[600]',
          dimParts
        )}
      >
        {integration.name}
      </div>
      <div className={clsx(dimParts)}>
        <Check onChange={() => {}} value={selected} />
      </div>
    </div>
  );
};

export const PicksSocialsComponent: FC<{
  toolTip?: boolean;
  list?: boolean;
}> = ({ toolTip, list }) => {
  const exising = useExistingData();

  const {
    locked,
    addOrRemoveSelectedIntegration,
    integrations,
    selectedIntegrations,
  } = useLaunchStore(
    useShallow((state) => ({
      integrations: state.integrations,
      selectedIntegrations: state.selectedIntegrations,
      addOrRemoveSelectedIntegration: state.addOrRemoveSelectedIntegration,
      locked: state.locked,
    }))
  );

  const availableIntegrations = integrations.filter((f) => {
    if (exising.integration) {
      return (
        f.id === exising.integration ||
        !!exising.siblings?.some((sibling) => sibling.integration === f.id)
      );
    }
    return !f.inBetweenSteps && !f.disabled;
  });

  const toggleIntegration = (integration: Integrations) => () => {
    if (exising.integration) {
      return;
    }
    addOrRemoveSelectedIntegration(integration, {});
  };

  if (list) {
    return (
      <div
        className={clsx(
          'flex flex-col gap-[4px]',
          locked && 'pointer-events-none'
        )}
      >
        {availableIntegrations.map((integration) => (
          <IntegrationListRow
            key={integration.id}
            integration={integration}
            selected={selectedIntegrations.some(
              (p) => p.integration.id === integration.id
            )}
            onClick={toggleIntegration(integration)}
            dimmed={locked}
          />
        ))}
      </div>
    );
  }

  // Paragon Social: channels as the design's pills ("IG Paragon · Instagram")
  return (
    <div
      className={clsx(
        'flex flex-wrap gap-[10px] flex-1',
        locked && 'pointer-events-none'
      )}
    >
      {availableIntegrations.map((integration) => {
        const selected =
          selectedIntegrations.findIndex(
            (p) => p.integration.id === integration.id
          ) !== -1;
        return (
          <button
            type="button"
            key={integration.id}
            onClick={toggleIntegration(integration)}
            aria-pressed={selected}
            className={clsx(
              'flex items-center gap-[10px] h-[44px] ps-[6px] pe-[16px] rounded-full border text-[14px] transition-colors',
              selected
                ? 'border-[#111214] bg-white text-[#111214] font-[600] shadow-[inset_0_0_0_1px_#111214]'
                : 'border-[#eceef1] bg-[#f6f7f8] text-[#5d616a] font-[500] hover:bg-white',
              locked && 'opacity-50'
            )}
          >
            <span className="relative">
              <ImageWithFallback
                fallbackSrc="/no-picture.jpg"
                src={integration.picture || '/no-picture.jpg'}
                className={clsx(
                  'rounded-full w-[30px] h-[30px] min-w-[30px] object-cover transition-all',
                  !selected && 'grayscale opacity-70'
                )}
                alt={integration.identifier}
                width={30}
                height={30}
              />
              <span
                className="absolute -bottom-[2px] -end-[2px] w-[10px] h-[10px] rounded-full border-[2px] border-white"
                style={{
                  background:
                    PARAGON_NETWORK_COLORS[integration.identifier] || '#5d616a',
                }}
              />
            </span>
            <span className="truncate max-w-[220px]">
              {integration.name} · {networkName(integration.identifier)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
