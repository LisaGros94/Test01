'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { Asset } from '@/types';

interface AnalysisResult {
  detected: boolean;
  class: Asset['class'];
  confidence: number;
  name: string;
  estimatedValue: number | null;
  currency: Asset['currency'];
  metadata: Asset['metadata'];
  notes?: string;
}

interface AssetPhotoUploadProps {
  onExtracted: (data: Partial<Asset>) => void;
  onCancel: () => void;
}

export default function AssetPhotoUpload({ onExtracted, onCancel }: AssetPhotoUploadProps) {
  const [stage, setStage] = useState<'idle' | 'preview' | 'analysing' | 'result' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)');
      setStage('error');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setStage('preview');
    };
    reader.readAsDataURL(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function analyse() {
    if (!file) return;
    setStage('analysing');

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
      const data: AnalysisResult = await res.json();

      if (!data.detected) {
        setError('Could not identify a financial asset in this image. Try a photo of a watch, car, document, or statement.');
        setStage('error');
        return;
      }

      setResult(data);
      setStage('result');
    } catch {
      setError('Analysis failed. Please try again.');
      setStage('error');
    }
  }

  function useResult() {
    if (!result) return;
    onExtracted({
      class: result.class,
      name: result.name,
      value: result.estimatedValue ?? 0,
      currency: result.currency ?? 'EUR',
      source: 'photo',
      metadata: result.metadata,
      lastUpdated: new Date().toISOString(),
    });
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Idle / Drop Zone */}
      {stage === 'idle' && (
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(56,189,248,0.4)',
            borderRadius: 18,
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(56,189,248,0.03)',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
            Drop a photo or document
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
            Watch, car, bank statement, pension letter,<br />share certificate, insurance policy
          </div>
          <div style={{ marginTop: 16, display: 'inline-block', padding: '8px 20px', background: '#0F172A', color: '#FFF', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            Choose file
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Preview */}
      {stage === 'preview' && preview && (
        <div>
          <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 14, marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStage('idle')} style={secondaryBtn}>Back</button>
            <button onClick={analyse} style={{ ...primaryBtn, flex: 1 }}>Analyse with AI →</button>
          </div>
        </div>
      )}

      {/* Analysing */}
      {stage === 'analysing' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 28, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Analysing image…</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Claude Vision is extracting asset details</div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <PulseBar />
          </div>
        </div>
      )}

      {/* Result */}
      {stage === 'result' && result && (
        <div>
          {preview && <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 14, marginBottom: 16 }} />}

          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Identified</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{Math.round(result.confidence * 100)}% confidence</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{result.name}</div>
            {result.estimatedValue && (
              <div style={{ fontSize: 14, color: '#0284C7', fontWeight: 600 }}>
                Est. {new Intl.NumberFormat('en-GB', { style: 'currency', currency: result.currency ?? 'EUR', maximumFractionDigits: 0 }).format(result.estimatedValue)}
              </div>
            )}
          </div>

          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Extracted details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(result.metadata).slice(0, 6).map(([k, v]) => v != null && (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ color: '#0F172A', fontWeight: 500 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.notes && (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginBottom: 16 }}>{result.notes}</div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStage('idle')} style={secondaryBtn}>Re-scan</button>
            <button onClick={useResult} style={{ ...primaryBtn, flex: 1 }}>Use these details →</button>
          </div>
        </div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: '#EF4444', marginBottom: 16 }}>{error}</div>
          <button onClick={() => setStage('idle')} style={primaryBtn}>Try again</button>
        </div>
      )}
    </div>
  );
}

function PulseBar() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%', background: '#38BDF8',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '12px 20px', background: '#0F172A', color: '#FFF',
  border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '12px 16px', background: 'rgba(0,0,0,0.04)', color: '#475569',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
};
