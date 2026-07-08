import type { ReactNode } from 'react';

type SplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div className="teach-layout">
      <aside className="teach-panel teach-panel--left">{left}</aside>
      <main className="teach-panel teach-panel--right">{right}</main>
    </div>
  );
}
