import { useState } from "react";
import { useStore } from "../store";
import { daysSince, personName } from "../lib";
import { SectionLabel, Sparkline } from "../ui";

const STALE_DAYS = 14;

function fmt(value: number, unit: string): string {
  return unit === "£k" ? `£${value}k` : `${value}${unit}`;
}

/**
 * Numbers — one page, ~eight metrics, one source of truth, updated weekly
 * by a named owner. Manual entry is correct at this stage.
 */
export default function Numbers() {
  const { state, recordMetric } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const commit = (id: string) => {
    const n = Number(draft);
    if (!Number.isNaN(n) && draft.trim() !== "") recordMetric(id, n);
    setEditingId(null);
    setDraft("");
  };

  const staleCount = state.metrics.filter((m) => daysSince(m.updatedAt) > STALE_DAYS).length;

  return (
    <div className="fade-in mx-auto max-w-5xl">
      <header className="mb-12">
        <h1 className="label-lg">Numbers</h1>
        <p className="mt-2 text-mid">
          Eight metrics, one source of truth, updated weekly by the named owner. Click a value to
          record this week.{" "}
          {staleCount > 0 && (
            <span className="text-oxblood">
              {staleCount} not updated in {STALE_DAYS} days.
            </span>
          )}
        </p>
      </header>

      <div className="hairline-b hidden gap-6 pb-2 lg:flex">
        <span className="label flex-1 text-mid">Metric</span>
        <span className="label w-32 text-mid">12 weeks</span>
        <span className="label w-20 text-right text-mid">Prior</span>
        <span className="label w-24 text-right text-mid">Now</span>
        <span className="label w-20 text-right text-mid">Target</span>
        <span className="label w-24 text-right text-mid">Owner</span>
        <span className="label w-28 text-right text-mid">Updated</span>
      </div>

      {state.metrics.map((m) => {
        const now = m.history[m.history.length - 1];
        const prior = m.history[m.history.length - 2];
        const stale = daysSince(m.updatedAt) > STALE_DAYS;
        return (
          <div key={m.id} className="hairline-b">
            <div className="flex flex-wrap items-center gap-6 py-4">
              <button
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                className="min-w-0 flex-1 text-left transition-opacity duration-150 hover:opacity-70"
              >
                {m.name}
                <span className="label ml-3 text-mid">{expanded === m.id ? "Hide" : "Definition"}</span>
              </button>
              <span className="w-32">
                <Sparkline values={m.history.map((h) => h.value)} />
              </span>
              <span className="w-20 text-right text-mid">
                {prior ? fmt(prior.value, m.unit) : "—"}
              </span>
              <span className="w-24 text-right">
                {editingId === m.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit(m.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => commit(m.id)}
                    className="hairline-b w-full py-1 text-right"
                    inputMode="decimal"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setDraft(now ? String(now.value) : "");
                    }}
                    className="w-full text-right transition-opacity duration-150 hover:opacity-70"
                  >
                    {now ? fmt(now.value, m.unit) : "—"}
                  </button>
                )}
              </span>
              <span className="w-20 text-right text-mid">
                {m.target !== null ? fmt(m.target, m.unit) : "—"}
              </span>
              <span className="label w-24 text-right text-mid">{personName(state, m.ownerId)}</span>
              <span className={`label w-28 text-right ${stale ? "text-oxblood" : "text-mid"}`}>
                {stale ? `Stale — ${daysSince(m.updatedAt)}d` : `${daysSince(m.updatedAt)}d ago`}
              </span>
            </div>
            {expanded === m.id && (
              <div className="fade-in pb-5 pr-6 md:w-2/3">
                <SectionLabel>Definition</SectionLabel>
                <p className="-mt-3 text-mid">{m.definition}</p>
              </div>
            )}
          </div>
        );
      })}

      <p className="mt-10 text-mid">
        Manual entry is deliberate — at this stage a named owner typing a number they stand behind
        beats a pipeline nobody trusts. Definitions are part of the metric: argue once, write it down.
      </p>
    </div>
  );
}
