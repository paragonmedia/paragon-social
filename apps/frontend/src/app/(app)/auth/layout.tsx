export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { ParagonPixelPanel } from '@gitroom/frontend/components/auth/paragon.pixel.panel';
import { AttributionComponent } from '@gitroom/frontend/components/auth/attribution.component';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Toaster } from '@gitroom/react/toaster/toaster';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MantineWrapper>
      <Toaster />
      <div className="bg-[#F4F2EF] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-[#141414]">
        {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
        <ReturnUrlComponent />
        <AttributionComponent />
        <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[12px] text-[#141414] p-[12px] bg-white border border-[#EBE7E2]">
          <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] h-full flex flex-col text-[#141414]">
            <LogoTextComponent />
            <div className="flex">{children}</div>
          </div>
        </div>
        <ParagonPixelPanel />
      </div>
    </MantineWrapper>
  );
}
