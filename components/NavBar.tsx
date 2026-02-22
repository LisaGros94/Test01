'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/today',     label: 'Today' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/assets',    label: 'Assets' },
  { href: '/advisor',   label: 'Advisor' },
];

export default function NavBar() {
  const path = usePathname();

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,9,13,0.92)',
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
            letterSpacing: -0.3,
            fontWeight: 400,
          }}>
            Clarity
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid var(--color-border-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600,
          letterSpacing: 0.5,
        }}>
          A
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,9,13,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = path === href || (href !== '/today' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 56, padding: '10px 0',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              {/* Active indicator */}
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20, height: 1.5,
                  background: 'var(--color-accent)',
                }} />
              )}
              <span style={{
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-accent)' : 'var(--color-text-3)',
                letterSpacing: active ? 0.3 : 0.2,
                transition: 'color 0.15s ease',
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
