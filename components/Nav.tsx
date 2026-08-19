'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

const ITEMS = [
  { href: '/', label: 'لوحة اليوم', icon: '⌂' },
  { href: '/students', label: 'الطلاب', icon: '◔' },
  { href: '/entry', label: 'إدخال يومي', icon: '✎' },
  { href: '/reports', label: 'التقارير', icon: '▤' },
  { href: '/stats', label: 'الإحصائيات', icon: '◒' }
];

export function TopBar() {
  const router = useRouter();
  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  }
  return (
    <div className="sticky top-0 z-30 bg-primarydark text-white flex items-center justify-between px-5 py-3">
      <div className="font-heading font-extrabold flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gold inline-block" /> دار التحفيظ
      </div>
      <button onClick={logout} className="text-xs text-[#CFE3D8] hover:text-white">
        تسجيل الخروج
      </button>
    </div>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex flex-col gap-1 w-56 flex-none p-4">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm ${
            pathname === item.href ? 'bg-primarysoft text-primarydark font-bold' : 'text-inksoft'
          }`}
        >
          <span className="w-5 text-center">{item.icon}</span> {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex z-30">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] ${
            pathname === item.href ? 'text-primarydark font-bold' : 'text-inksoft'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
