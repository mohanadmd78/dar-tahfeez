'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRole } from '@/lib/useRole';
import {
  LayoutGrid,
  ListChecks,
  Users,
  PenLine,
  FileBarChart,
  BarChart3,
  LogOut
} from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'لوحة اليوم', Icon: LayoutGrid, adminOnly: false },
  { href: '/bulk-attendance', label: 'تسجيل جماعي', Icon: ListChecks, adminOnly: true },
  { href: '/students', label: 'الطلاب', Icon: Users, adminOnly: false },
  { href: '/entry', label: 'إدخال يومي', Icon: PenLine, adminOnly: true },
  { href: '/reports', label: 'التقارير', Icon: FileBarChart, adminOnly: false },
  { href: '/stats', label: 'الإحصائيات', Icon: BarChart3, adminOnly: false }
];

export function TopBar() {
  const router = useRouter();
  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  }
  return (
    <div className="sticky top-0 z-30 bg-primarydark text-white flex items-center justify-between px-5 py-3 shadow-sm">
      <div className="font-heading font-extrabold flex items-center gap-2 tracking-wide">
        <span className="w-2 h-2 rounded-full bg-gold inline-block shadow-[0_0_8px_rgba(201,162,39,0.6)]" />
        حلقة أهل القرآن
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-1.5 text-xs text-[#CFE3D8] hover:text-white transition-colors"
      >
        <LogOut size={14} strokeWidth={2} />
        تسجيل الخروج
      </button>
    </div>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);
  return (
    <nav className="hidden md:flex flex-col gap-1 w-56 flex-none p-4">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
              active
                ? 'bg-primarysoft text-primarydark font-bold'
                : 'text-inksoft hover:bg-primarysoft/50 hover:text-primarydark'
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} className="flex-none" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex z-30 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10.5px] transition-colors ${
              active ? 'text-primarydark font-bold' : 'text-inksoft'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
