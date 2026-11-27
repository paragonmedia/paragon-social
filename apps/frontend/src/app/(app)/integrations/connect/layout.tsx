import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Connect Channel',
};

export default async function ConnectLinkLayout({
  children,
}: {
  children: ReactNode;
}) {
  // w-full: the page can be taller than a small window, and w-screen then adds
  // a horizontal scrollbar next to the vertical one
  return (
    <div className="bg-[#f6f7f8] flex flex-1 min-h-screen w-full">
      {children}
    </div>
  );
}
