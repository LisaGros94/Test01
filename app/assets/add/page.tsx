'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AssetPhotoUpload from '@/components/AssetPhotoUpload';
import type { Asset, AssetClass, Currency } from '@/types';

const CLASS_OPTIONS: { value: AssetClass; label: string; icon: string }[] = [
  { value: 'real_estate',    label: 'Real Estate',     icon: '🏛' },
  { value: 'stocks',         label: 'Stocks & ETFs',   icon: '📈' },
  { value: 'pension',        label: 'Pension',         icon: '◎' },
  { value: 'private_equity', label: 'Private Equity',  icon: '◈' },
  { value: 'cars',           label: 'Cars',            icon: '🚗' },
  { value: 'watches',        label: 'Watches',         icon: '⌚' },
  { value: 'cash',           label: 'Cash',            icon: '◻' },
  { value: 'bonds',          label: 'Bonds',           icon: '⊞' },
  { value: 'crypto',         label: 'Crypto',          icon: '◆' },
  { value: 'art',            label: 'Art',             icon: '🎨' },
  { value: 'commodities',    label: 'Commodities',     icon: '◎' },
];

const CURRENCIES: Currency[] = ['EUR', 'GBP', 'USD', 'CHF'];

type EntryMode = 'choose' | 'photo' | 'manual';

export default function AddAssetPage() {
  const router = useRouter();
  const { addAsset, computePortfolio } = useStore();
  const [mode, setMode] = useState<EntryMode>('choose');
  const [form, setForm] = useState<Partial<Asset>>({
    class: 'stocks',
    currency: 'EUR',
    source: 'manual',
    lastUpdated: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof Asset, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setMeta(key: string, value: unknown) {
    setForm((f) => ({ ...f, metadata: { ...f.metadata, [key]: value } }));
  }

  function handlePhotoExtracted(data: Partial<Asset>) {
    setForm((f) => ({ ...f, ...data }));
    setMode('manual'); // Switch to manual to let user review/edit
  }

  async function save() {
    if (!form.name || !form.value || !form.class) return;
    setSaving(true);
    const asset: Asset = {
      id: `a-${Date.now()}`,
      name: form.name,
      class: form.class,
      value: Number(form.value),
      currency: form.currency ?? 'EUR',
      source: form.source ?? 'manual',
      country: form.country,
      institution: form.institution,
      costBasis: form.costBasis ? Number(form.costBasis) : undefined,
      metadata: form.metadata,
      notes: form.notes,
      lastUpdated: new Date().toISOString(),
    };
    addAsset(asset);
    computePortfolio();
    router.push('/assets');
  }

  const cls = form.class;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ paddingTop: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14 }}>
            ← Back
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500, color: '#0F172A', margin: 0 }}>
            Add Asset
          </h1>
        </div>

        {/* Mode picker */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setMode('photo')} style={bigOptionBtn}>
              <span style={{ fontSize: 28 }}>📷</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Photo or Document</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>AI extracts all details automatically</div>
              </div>
            </button>
            <button onClick={() => setMode('manual')} style={bigOptionBtn}>
              <span style={{ fontSize: 28 }}>✏️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Enter manually</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Type in the details yourself</div>
              </div>
            </button>
          </div>
        )}

        {/* Photo mode */}
        {mode === 'photo' && (
          <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20 }}>
            <AssetPhotoUpload
              onExtracted={handlePhotoExtracted}
              onCancel={() => setMode('choose')}
            />
          </div>
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Asset class */}
            <div style={section}>
              <div style={label}>Asset type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CLASS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('class', opt.value)}
                    style={{
                      padding: '7px 13px',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: cls === opt.value ? '#0F172A' : 'rgba(0,0,0,0.08)',
                      background: cls === opt.value ? '#0F172A' : 'rgba(255,255,255,0.7)',
                      color: cls === opt.value ? '#FFF' : '#475569',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={section}>
              <div style={label}>Asset name</div>
              <input
                placeholder={cls === 'real_estate' ? 'e.g. Apartment — Berlin Mitte' : cls === 'cars' ? 'e.g. Porsche 911 GT3 2023' : cls === 'watches' ? 'e.g. Rolex Daytona 116500LN' : 'e.g. MSCI World ETF'}
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                style={input}
              />
            </div>

            {/* Value + Currency */}
            <div style={section}>
              <div style={label}>Current value</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="0"
                  value={form.value ?? ''}
                  onChange={(e) => set('value', e.target.value)}
                  style={{ ...input, flex: 1 }}
                />
                <select value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} style={{ ...input, width: 80, flex: 'none' }}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Cost basis */}
            <div style={section}>
              <div style={label}>Cost basis (optional)</div>
              <input
                type="number"
                placeholder="Original purchase price"
                value={form.costBasis ?? ''}
                onChange={(e) => set('costBasis', e.target.value)}
                style={input}
              />
            </div>

            {/* Class-specific metadata */}
            {cls === 'real_estate' && (
              <div style={section}>
                <div style={label}>Property details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Address" value={form.metadata?.address ?? ''} onChange={(e) => setMeta('address', e.target.value)} style={input} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Mortgage balance" value={form.metadata?.mortgageBalance ?? ''} onChange={(e) => setMeta('mortgageBalance', Number(e.target.value))} style={{ ...input, flex: 1 }} />
                    <input type="number" placeholder="Rate %" value={form.metadata?.mortgageRate ?? ''} onChange={(e) => setMeta('mortgageRate', Number(e.target.value))} style={{ ...input, width: 80, flex: 'none' }} />
                  </div>
                  <input type="date" placeholder="Mortgage expiry" value={form.metadata?.mortgageExpiry ?? ''} onChange={(e) => setMeta('mortgageExpiry', e.target.value)} style={input} />
                  <input type="number" placeholder="Annual costs (insurance, service charge)" value={form.metadata?.annualCosts ?? ''} onChange={(e) => setMeta('annualCosts', Number(e.target.value))} style={input} />
                </div>
              </div>
            )}

            {cls === 'cars' && (
              <div style={section}>
                <div style={label}>Vehicle details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Make" value={form.metadata?.make ?? ''} onChange={(e) => setMeta('make', e.target.value)} style={{ ...input, flex: 1 }} />
                    <input placeholder="Model" value={form.metadata?.model ?? ''} onChange={(e) => setMeta('model', e.target.value)} style={{ ...input, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Year" value={form.metadata?.year ?? ''} onChange={(e) => setMeta('year', Number(e.target.value))} style={{ ...input, flex: 1 }} />
                    <input type="number" placeholder="Mileage (km)" value={form.metadata?.mileage ?? ''} onChange={(e) => setMeta('mileage', Number(e.target.value))} style={{ ...input, flex: 1 }} />
                  </div>
                  <input type="number" placeholder="Annual insurance" value={form.metadata?.annualInsurance ?? ''} onChange={(e) => setMeta('annualInsurance', Number(e.target.value))} style={input} />
                </div>
              </div>
            )}

            {cls === 'watches' && (
              <div style={section}>
                <div style={label}>Watch details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Brand (e.g. Rolex)" value={form.metadata?.brand ?? ''} onChange={(e) => setMeta('brand', e.target.value)} style={{ ...input, flex: 1 }} />
                    <input placeholder="Reference" value={form.metadata?.reference ?? ''} onChange={(e) => setMeta('reference', e.target.value)} style={{ ...input, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                      <input type="checkbox" checked={form.metadata?.hasBox ?? false} onChange={(e) => setMeta('hasBox', e.target.checked)} />
                      Box
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                      <input type="checkbox" checked={form.metadata?.hasPapers ?? false} onChange={(e) => setMeta('hasPapers', e.target.checked)} />
                      Papers
                    </label>
                  </div>
                </div>
              </div>
            )}

            {cls === 'pension' && (
              <div style={section}>
                <div style={label}>Pension details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Provider (e.g. Vanguard)" value={form.institution ?? ''} onChange={(e) => set('institution', e.target.value)} style={input} />
                  <input type="number" placeholder="Monthly contribution" value={form.metadata?.contributionMonthly ?? ''} onChange={(e) => setMeta('contributionMonthly', Number(e.target.value))} style={input} />
                </div>
              </div>
            )}

            {/* Country + Notes */}
            <div style={section}>
              <div style={label}>Country / Jurisdiction</div>
              <input placeholder="e.g. DE, GB, CH" value={form.country ?? ''} onChange={(e) => set('country', e.target.value.toUpperCase())} style={input} maxLength={2} />
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={!form.name || !form.value || saving}
              style={{
                width: '100%', padding: '16px', background: form.name && form.value ? '#0F172A' : '#E2E8F0',
                color: form.name && form.value ? '#FFF' : '#94A3B8',
                border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
                cursor: form.name && form.value ? 'pointer' : 'default',
                marginTop: 8,
              }}
            >
              {saving ? 'Saving…' : 'Save Asset'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const section: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 18,
  padding: '16px 18px',
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: '#94A3B8',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 10,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(241,245,249,0.8)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 12,
  fontSize: 14,
  color: '#0F172A',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const bigOptionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '20px 20px',
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 18,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};
