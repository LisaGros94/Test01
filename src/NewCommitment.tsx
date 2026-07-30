import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "./store";

export default function NewCommitment({ onClose }: { onClose: () => void }) {
  const { state, createCommitment } = useStore();
  const [title, setTitle] = useState("");
  const [workstreamId, setWorkstreamId] = useState(state.workstreams[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState<string>(state.meId);
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => inputRef.current?.focus(), []);

  const submit = () => {
    if (!title.trim()) return;
    const id = createCommitment({
      title: title.trim(),
      workstreamId,
      ownerId: ownerId || null,
      dueDate: dueDate || null,
      labels: labels
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean),
    });
    onClose();
    navigate(`/work?open=${id}`);
  };

  const field = "hairline-b w-full py-3 text-[15px]";
  const selectCls = "hairline-b w-full appearance-none py-3 text-[15px]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/20 pt-[16vh]"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="fade-in w-full max-w-xl bg-paper px-8 py-8"
        style={{ border: "1px solid var(--hairline)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label mb-6 text-mid">New commitment</div>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="A dated outcome — what will be true, and when"
          className={field}
        />
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <div className="label mb-1 text-mid">Workstream</div>
            <select value={workstreamId} onChange={(e) => setWorkstreamId(e.target.value)} className={selectCls}>
              {state.workstreams.filter((w) => !w.archived).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="label mb-1 text-mid">Owner — one name, never shared</div>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={selectCls}>
              <option value="">Unowned</option>
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="label mb-1 text-mid">Due date</div>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
          </div>
          <div>
            <div className="label mb-1 text-mid">Labels, comma-separated</div>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="fundraise, legal"
              className={field}
            />
          </div>
        </div>
        <div className="mt-9 flex items-center justify-between">
          <span className="label text-mid">Enter to create · Esc to close</span>
          <button
            onClick={submit}
            className="label border border-ink px-6 py-2.5 transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
