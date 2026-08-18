'use client';
import { TopBar, SideNav, BottomNav } from './Nav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopBar />
      <div className="flex max-w-[1180px] mx-auto">
        <SideNav />
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
