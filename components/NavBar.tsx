'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/today',     icon: '◈', label: 'Today' },
  { href: '/portfolio', icon: '◎', label: 'Portfolio' },
  { href: '/assets',   icon: '⊟', label: 'Assets' },
  { href: '/advisor',  icon: '◷', label: 'Advisor' },
];

export default function NavBar() {
  const path = usePathname();

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(248,250,252,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
      }}>
        <Link href="/today" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#0F172A', letterSpacing: -0.5 }}>
            Clarity
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 13, fontWeight: 600 }}>
          A
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = path === href || (href !== '/today' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0', textDecoration: 'none',
                color: active ? '#0F172A' : '#94A3B8',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 3 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
