'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import ConvaiAdvisor from '@/components/ConvaiAdvisor';

export default function AdvisorPage() {
  const { computePortfolio, portfolio, assets, profile } = useStore();

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      paddingTop: 56,
      paddingBottom: 60,
    }}>
      <ConvaiAdvisor
        portfolio={portfolio}
        assets={assets}
        profile={profile}
      />
    </div>
  );
}
