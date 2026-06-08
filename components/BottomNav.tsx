'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard',   icon: '🏠', label: 'Inicio' },
  { href: '/quiniela',    icon: '🎯', label: 'Quiniela' },
  { href: '/leaderboard', icon: '🏆', label: 'Ranking' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.rol === 'ADMIN') {
      setIsAdmin(true);
    }
  }, [pathname]);

  const activeNavItems = isAdmin
    ? [...navItems, { href: '/admin', icon: '⚙️', label: 'Admin' }]
    : navItems;

  // Ocultar en la pantalla de login
  if (pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Glow line at top */}
      <div className="glow-line" />
      <div className="glass-strong" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
        <div className="flex max-w-md mx-auto">
          {activeNavItems.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-3.5 gap-0.5 transition-all duration-200 active:scale-90 ${
                  active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                  {label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
