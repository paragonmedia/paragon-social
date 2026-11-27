'use client';

import { MediaBox } from '@gitroom/frontend/components/media/media.component';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Paragon Social: "Biblioteca" screen of the design
export const MediaLayoutComponent = () => {
  const t = useT();
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-[20px] px-[32px] pt-[28px] pb-[48px] mobile:px-[16px] mobile:pt-[16px]">
      <header className="flex flex-col gap-[4px]">
        <h1 className="m-0 font-heading text-[30px] mobile:text-[24px] font-[700] -tracking-[0.6px] text-[#111214]">
          {t('paragon_menu_library', 'Library')}
        </h1>
        <p className="m-0 text-[14px] text-[#5d616a]">
          {t('paragon_media_subtitle', 'Images and videos of your space')}
        </p>
      </header>
      <MediaBox setMedia={() => {}} closeModal={() => {}} standalone={true} />
    </div>
  );
};
