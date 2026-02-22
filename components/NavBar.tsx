'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/today',     icon: '◈', label: 'Today' },
  { href: '/portfolio', icon: '◎', label: 'Portfolio' },
  { href: '/assets',    icon: '⊟', label: 'Assets' },
  { href: '/advisor',   icon: '◷', label: 'Advisor' },
];

export default function NavBar() {
  const path = usePathname();

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(248,250,252,0.90)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--color-border)',
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 var(--sp-lg)',
      }}>
        <Link href="/today" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--color-accent)',
            letterSpacing: -0.5,
            fontWeight: 500,
          }}>
            Clarity
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFF', fontSize: 13, fontWeight: 700,
          flexShrink: 0,
        }}>
          A
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(248,250,252,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = path === href || (href !== '/today' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 56,
                padding: '8px 0',
                textDecoration: 'none',
                color: active ? 'var(--color-accent)' : 'var(--color-text-3)',
                transition: 'color 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--color-accent)',
                }} />
              )}
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 3, marginTop: active ? 4 : 0 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.2 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
