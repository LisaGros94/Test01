import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "./store";
import { search } from "./lib";
import { StatusDot, Kbd } from "./ui";

export default function CommandK({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const hits = search(state, q);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => setSel(0), [q]);

  const open = (i: number) => {
    const hit = hits[i];
    if (!hit) return;
    const commitmentId =
      hit.type === "commitment" ? hit.item.id : hit.item.commitmentId;
    navigate(`/work?open=${commitmentId}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/20 pt-[18vh]"
      onClick={onClose}
    >
      <div
        className="fade-in w-full max-w-xl bg-paper shadow-none"
        style={{ border: "1px solid var(--hairline)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n"))
              setSel((s) => Math.min(s + 1, hits.length - 1));
            if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p"))
              setSel((s) => Math.max(s - 1, 0));
            if (e.key === "Enter") open(sel);
          }}
          placeholder="Search commitments and tasks"
          className="hairline-b w-full px-6 py-5 text-[15px]"
        />
        {q && (
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {hits.length === 0 && (
              <div className="px-6 py-5 text-mid">Nothing found.</div>
            )}
            {["commitment", "task"].map((type) => {
              const group = hits.filter((h) => h.type === type);
              if (group.length === 0) return null;
              return (
                <div key={type} className="py-2">
                  <div className="label px-6 pb-2 text-mid">
                    {type === "commitment" ? "Commitments" : "Tasks"}
                  </div>
                  {group.map((h) => {
                    const i = hits.indexOf(h);
                    return (
                      <button
                        key={h.item.id}
                        onClick={() => open(i)}
                        onMouseEnter={() => setSel(i)}
                        className={`flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors duration-150 ${
                          i === sel ? "bg-[var(--tint-soft)]" : ""
                        }`}
                        style={
                          i === sel
                            ? { background: "var(--tint-soft)" }
                            : undefined
                        }
                      >
                        <StatusDot status={h.item.status} />
                        <span className="truncate">{h.item.title}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        <div className="hairline-t flex items-center gap-4 px-6 py-3">
          <Kbd>↑↓</Kbd>
          <span className="label text-mid">Navigate</span>
          <Kbd>↵</Kbd>
          <span className="label text-mid">Open</span>
          <Kbd>Esc</Kbd>
          <span className="label text-mid">Close</span>
        </div>
      </div>
    </div>
  );
}
