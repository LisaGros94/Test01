'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import AdvisorChat from '@/components/AdvisorChat';

export default function AdvisorPage() {
  const { computePortfolio, portfolio } = useStore();

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', paddingTop: 56, paddingBottom: 60 }}>
      <AdvisorChat />
    </div>
  );
}
