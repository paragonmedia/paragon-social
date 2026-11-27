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
      {/* Paragon Social: auth layout from the design (form left, pixel panel right) */}
      <div className="flex flex-wrap min-h-screen w-screen bg-white text-[#111214]">
        <ReturnUrlComponent />
        <AttributionComponent />
        <section className="flex flex-col justify-between gap-[40px] flex-[1_1_460px] px-[56px] py-[48px] mobile:px-[22px] mobile:py-[28px]">
          <LogoTextComponent />
          <div className="flex w-full max-w-[400px]">{children}</div>
          <div className="flex flex-wrap gap-[18px] text-[12px] text-[#6b6f78]">
            <span>© {new Date().getFullYear()} MEDIA PARAGON LLC</span>
            <a
              href="https://weareparagonmedia.com/privacy"
              className="hover:text-[#111214]"
            >
              Privacidad
            </a>
            <a
              href="https://weareparagonmedia.com/terms"
              className="hover:text-[#111214]"
            >
              Términos
            </a>
          </div>
        </section>
        <ParagonPixelPanel />
      </div>
    </MantineWrapper>
  );
}
