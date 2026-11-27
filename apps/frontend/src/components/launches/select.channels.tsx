'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { uniqBy } from 'lodash';
import { useClickOutside } from '@mantine/hooks';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { FilterIcon } from '@gitroom/frontend/components/ui/icons';
import { Check } from '@gitroom/frontend/components/launches/tags.component';
import { IntegrationListRow } from '@gitroom/frontend/components/new-launch/picks.socials.component';

export const SelectChannels: FC<{
  list?: boolean;
}> = ({ list }) => {
  const { integrations, customer, selectedChannels, setSelectedChannels } =
    useCalendar();
  const t = useT();
  const [pos, setPos] = useState<any>({});
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => {
    if (open) {
      setOpen(false);
    }
  });

  const channels = useMemo(
    () =>
      integrations.filter((i) => !customer || i.customer?.id === customer),
    [integrations, customer]
  );

  const selectedIds = selectedChannels ?? channels.map((c) => c.id);
  const allSelected = channels.every((c) => selectedIds.includes(c.id));

  const openClose = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }

    const { x, y, height } = ref.current?.getBoundingClientRect();
    setPos({ top: y + height, left: Math.min(x, window.innerWidth - 270) });
    setOpen(true);
  }, [open]);

  const toggleAll = useCallback(() => {
    setSelectedChannels(allSelected ? [] : null);
  }, [allSelected]);

  const toggle = useCallback(
    (id: string) => () => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id];
      setSelectedChannels(next.length === channels.length ? null : next);
    },
    [selectedIds, channels]
  );

  if (channels.length <= 1) {
    return null;
  }

  if (list) {
    // the customers are listed above the channels when there are any
    const hasCustomers =
      uniqBy(integrations, (i) => i?.customer?.id).length > 1;
    return (
      <div className="flex flex-col gap-[4px]">
        {hasCustomers && (
          <div className="text-[14px] font-[600] text-textItemBlur">
            {t('channels', 'Channels')}
          </div>
        )}
        <div
          onClick={toggleAll}
          className="flex items-center gap-[12px] py-[8px] cursor-pointer select-none"
        >
          <div className="flex-1 text-[14px] font-[600]">
            {t('select_all', 'Select all')}
          </div>
          <Check onChange={() => {}} value={allSelected} />
        </div>
        {channels.map((p) => (
          <IntegrationListRow
            key={p.id}
            integration={p}
            selected={selectedIds.includes(p.id)}
            onClick={toggle(p.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative select-none z-[500]" ref={ref}>
      <div
        data-tooltip-id="tooltip"
        data-tooltip-content={t('select_channels_tooltip', 'Select Channels')}
        onClick={openClose}
        className={clsx(
          'relative z-[20] cursor-pointer h-[44px] w-[44px] rounded-[12px] border bg-white flex items-center justify-center text-[#111214] hover:bg-[#f6f7f8] [&_svg]:w-[18px] [&_svg]:h-[18px]',
          open || !allSelected ? 'border-[#f93b4f] text-[#f93b4f]' : 'border-[#dfe1e5]'
        )}
      >
        <FilterIcon />
      </div>
      {open && (
        <div
          style={pos}
          className="flex flex-col fixed p-[6px] bg-white border border-[#eceef1] rounded-[14px] shadow-[0_12px_32px_rgba(17,18,20,.12)] min-w-[250px] max-h-[320px] overflow-y-auto"
        >
          <div className="px-[10px] py-[10px] rounded-[10px] hover:bg-[#f6f7f8] text-[14px] font-[600] flex items-center">
            <Checkbox
              disableForm={true}
              checked={allSelected}
              onChange={toggleAll}
              label={t('select_all', 'Select all')}
            />
          </div>
          {channels.map((p) => (
            <div
              key={p.id}
              className="px-[10px] py-[10px] rounded-[10px] hover:bg-[#f6f7f8] text-[14px] font-[500] flex items-center gap-[10px]"
            >
              <Checkbox
                disableForm={true}
                checked={selectedIds.includes(p.id)}
                onChange={toggle(p.id)}
              />
              <img
                className="w-[24px] h-[24px] rounded-full"
                src={p.picture || '/no-picture.jpg'}
                alt=""
              />
              <div className="truncate">{p.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
