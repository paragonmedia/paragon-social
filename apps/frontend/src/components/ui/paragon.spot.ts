import type React from 'react';

// Paragon Social: mouse spotlight of the design cards (".paragon-spot" in global.scss)
export const spot = (e: React.PointerEvent<HTMLElement>) => {
  if (e.pointerType === 'touch') return;
  const target = e.currentTarget;
  const box = target.getBoundingClientRect();
  target.style.setProperty('--x', e.clientX - box.left + 'px');
  target.style.setProperty('--y', e.clientY - box.top + 'px');
};
