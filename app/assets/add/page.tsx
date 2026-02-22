'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AssetPhotoUpload from '@/components/AssetPhotoUpload';
import type { Asset, AssetClass, Currency } from '@/types';

const CLASS_OPTIONS: { value: AssetClass; label: string; icon: string }[] = [
  { value: 'real_estate',    label: 'Real Estate',    icon: '△' },
  { value: 'stocks',         label: 'Stocks & ETFs',  icon: '↗' },
  { value: 'pension',        label: 'Pension',        icon: '◎' },
  { value: 'private_equity', label: 'Private Equity', icon: '◇' },
  { value: 'cars',           label: 'Cars',           icon: '▷' },
  { value: 'watches',        label: 'Watches',        icon: '◉' },
  { value: 'cash',           label: 'Cash',           icon: '▭' },
  { value: 'bonds',          label: 'Bonds',          icon: '▣' },
  { value: 'crypto',         label: 'Crypto',         icon: '◆' },
  { value: 'art',            label: 'Art',            icon: '⬡' },
  { value: 'commodities',    label: 'Commodities',    icon: '○' },
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
    setMode('manual');
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
  const canSave = Boolean(form.name && form.value);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Header */}
        <div style={{ paddingTop: 12, marginBottom: 'var(--sp-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, minHeight: 44, padding: '0 4px' }}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--color-text-1)', margin: 0 }}>
            Add Asset
          </h1>
        </div>

        {/* Mode picker */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {[
              { mode: 'photo' as EntryMode, icon: '◈', title: 'Scan Document or Photo', sub: 'AI extracts all details automatically' },
              { mode: 'manual' as EntryMode, icon: '◻', title: 'Enter manually', sub: 'Type in the details yourself' },
            ].map((opt) => (
              <button key={opt.mode} onClick={() => setMode(opt.mode)} style={bigOptionBtn}>
                <span style={{ fontSize: 18, color: 'var(--color-accent)', flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)' }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 3 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Photo mode */}
        {mode === 'photo' && (
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--r-xl)' }}>
            <AssetPhotoUpload onExtracted={handlePhotoExtracted} onCancel={() => setMode('choose')} />
          </div>
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Asset class */}
            <div style={section}>
              <div style={fieldLabel}>Asset type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CLASS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('class', opt.value)}
                    style={{
                      padding: '0 12px', height: 34,
                      borderRadius: 'var(--r-pill)',
                      border: '1px solid',
                      borderColor: cls === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
                      background: cls === opt.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      color: cls === opt.value ? '#08090D' : 'var(--color-text-2)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={section}>
              <div style={fieldLabel}>Asset name</div>
              <input
                placeholder={
                  cls === 'real_estate' ? 'e.g. Apartment — Berlin Mitte'
                  : cls === 'cars' ? 'e.g. Porsche 911 GT3 2023'
                  : cls === 'watches' ? 'e.g. Rolex Daytona 116500LN'
                  : 'e.g. MSCI World ETF'
                }
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Value + Currency */}
            <div style={section}>
              <div style={fieldLabel}>Current value</div>
              <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                <input
                  type="number" placeholder="0"
                  value={form.value ?? ''}
                  onChange={(e) => set('value', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value as Currency)}
                  style={{ ...inputStyle, width: 80, flex: 'none' }}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Cost basis */}
            <div style={section}>
              <div style={fieldLabel}>Cost basis (optional)</div>
              <input
                type="number" placeholder="Original purchase price"
                value={form.costBasis ?? ''}
                onChange={(e) => set('costBasis', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Class-specific fields */}
            {cls === 'real_estate' && (
              <div style={section}>
                <div style={fieldLabel}>Property details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  <input placeholder="Address" value={form.metadata?.address ?? ''} onChange={(e) => setMeta('address', e.target.value)} style={inputStyle} />
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                    <input type="number" placeholder="Mortgage balance" value={form.metadata?.mortgageBalance ?? ''} onChange={(e) => setMeta('mortgageBalance', Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                    <input type="number" placeholder="Rate %" value={form.metadata?.mortgageRate ?? ''} onChange={(e) => setMeta('mortgageRate', Number(e.target.value))} style={{ ...inputStyle, width: 80, flex: 'none' }} />
                  </div>
                  <input type="date" value={form.metadata?.mortgageExpiry ?? ''} onChange={(e) => setMeta('mortgageExpiry', e.target.value)} style={inputStyle} />
                  <input type="number" placeholder="Annual costs" value={form.metadata?.annualCosts ?? ''} onChange={(e) => setMeta('annualCosts', Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
            )}

            {cls === 'cars' && (
              <div style={section}>
                <div style={fieldLabel}>Vehicle details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                    <input placeholder="Make" value={form.metadata?.make ?? ''} onChange={(e) => setMeta('make', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <input placeholder="Model" value={form.metadata?.model ?? ''} onChange={(e) => setMeta('model', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                    <input type="number" placeholder="Year" value={form.metadata?.year ?? ''} onChange={(e) => setMeta('year', Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                    <input type="number" placeholder="Mileage (km)" value={form.metadata?.mileage ?? ''} onChange={(e) => setMeta('mileage', Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
              </div>
            )}

            {cls === 'watches' && (
              <div style={section}>
                <div style={fieldLabel}>Watch details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                    <input placeholder="Brand (e.g. Rolex)" value={form.metadata?.brand ?? ''} onChange={(e) => setMeta('brand', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <input placeholder="Reference" value={form.metadata?.reference ?? ''} onChange={(e) => setMeta('reference', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-lg)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-2)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.metadata?.hasBox ?? false} onChange={(e) => setMeta('hasBox', e.target.checked)} />
                      Box
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-2)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.metadata?.hasPapers ?? false} onChange={(e) => setMeta('hasPapers', e.target.checked)} />
                      Papers
                    </label>
                  </div>
                </div>
              </div>
            )}

            {cls === 'pension' && (
              <div style={section}>
                <div style={fieldLabel}>Pension details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  <input placeholder="Provider (e.g. Vanguard)" value={form.institution ?? ''} onChange={(e) => set('institution', e.target.value)} style={inputStyle} />
                  <input type="number" placeholder="Monthly contribution" value={form.metadata?.contributionMonthly ?? ''} onChange={(e) => setMeta('contributionMonthly', Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
            )}

            {/* Country */}
            <div style={section}>
              <div style={fieldLabel}>Country / Jurisdiction</div>
              <input
                placeholder="DE · GB · CH"
                value={form.country ?? ''}
                onChange={(e) => set('country', e.target.value.toUpperCase())}
                style={inputStyle}
                maxLength={2}
              />
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={!canSave || saving}
              style={{
                width: '100%', height: 52,
                background: canSave ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: canSave ? '#08090D' : 'var(--color-text-3)',
                border: canSave ? 'none' : '1px solid var(--color-border)',
                borderRadius: 'var(--r-pill)',
                fontSize: 15, fontWeight: 700,
                cursor: canSave ? 'pointer' : 'default',
                marginTop: 'var(--sp-sm)',
                transition: 'all 0.2s ease',
                letterSpacing: 0.2,
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
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-xl)',
  padding: '16px 18px',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-3)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.0,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-md)',
  fontSize: 14,
  color: 'var(--color-text-1)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const bigOptionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sp-md)',
  padding: 'var(--sp-lg)',
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-xl)',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  minHeight: 76,
  transition: 'border-color 0.15s ease',
};
