import { ReactNode } from 'react';
import { PreviewWrapper } from '@gitroom/frontend/components/preview/preview.wrapper';

export default async function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#f6f7f8] min-h-screen text-[#111214]">
      <PreviewWrapper>{children}</PreviewWrapper>
    </div>
  );
}
