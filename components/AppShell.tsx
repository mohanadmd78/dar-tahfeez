'use client';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar, SideNav, BottomNav } from './Nav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <TopBar />
      <div className="flex max-w-[1180px] mx-auto">
        <SideNav />
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
