'use client';
import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';

export const MenuItem: FC<{ label: string; icon: ReactNode; path: string; onClick?: () => void }> = ({
  label,
  icon,
  path,
  onClick,
}) => {
  const currentPath = usePathname();
  const isActive = currentPath.indexOf(path) === 0;

  // Paragon Social: rows with icon + label on the dark sidebar
  const className = clsx(
    'group w-full h-[44px] px-[12px] gap-[12px] flex items-center rounded-[10px] text-[14px] transition-colors mobile:h-[40px]',
    isActive
      ? 'bg-[#1f2126] text-white font-[500]'
      : 'text-[#c6c9cf] hover:bg-[#1b1d21] hover:text-white'
  );

  const inner = (
    <>
      <div
        className={clsx(
          'flex items-center justify-center w-[20px] h-[20px] [&_svg]:max-w-[20px] [&_svg]:max-h-[20px]',
          isActive && 'text-[#f93b4f]'
        )}
      >
        {icon}
      </div>
      <div className="truncate">{label}</div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} title={label} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      prefetch={true}
      href={path}
      title={label}
      {...path.indexOf('http') === 0 && { target: '_blank' }}
      className={className}
    >
      {inner}
    </Link>
  );
};
