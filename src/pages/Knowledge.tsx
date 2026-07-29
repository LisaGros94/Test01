import { useMemo, useState } from "react";
import { useStore } from "../store";
import { personName } from "../lib";
import { SectionLabel } from "../ui";

/**
 * Knowledge — a curated front door, not a content store.
 * Every entry links out (Drive, handbook, directory) and has a named owner.
 */
export default function Knowledge() {
  const { state, addKnowledgeLink, removeKnowledgeLink } = useStore();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [section, setSection] = useState("");
  const [note, setNote] = useState("");

  const sections = useMemo(() => {
    const order: string[] = [];
    for (const k of state.knowledgeLinks)
      if (!order.includes(k.section)) order.push(k.section);
    return order;
  }, [state.knowledgeLinks]);

  const submit = () => {
    if (!title.trim() || !url.trim()) return;
    addKnowledgeLink({
      title: title.trim(),
      url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
      section: section.trim() || "General",
      ownerId: state.meId,
      note: note.trim(),
    });
    setTitle("");
    setUrl("");
    setNote("");
    setAdding(false);
  };

  const field = "hairline-b w-full py-2 text-[15px]";

  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-12 flex items-end justify-between gap-6">
        <div>
          <h1 className="label-lg">Knowledge</h1>
          <p className="mt-2 text-mid">
            The front door to everything written down. Each entry links out and has one named owner —
            if it's wrong, you know who to ask.
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="label whitespace-nowrap text-mid transition-opacity hover:text-ink"
        >
          {adding ? "Cancel" : "Add link"}
        </button>
      </header>

      {adding && (
        <div className="fade-in mb-12 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <div>
            <div className="label mb-1 text-mid">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Employee handbook" />
          </div>
          <div>
            <div className="label mb-1 text-mid">URL</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={field} placeholder="drive.google.com/…" />
          </div>
          <div>
            <div className="label mb-1 text-mid">Section</div>
            <input value={section} onChange={(e) => setSection(e.target.value)} className={field} placeholder="Policies" list="kb-sections" />
            <datalist id="kb-sections">
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <div className="label mb-1 text-mid">One line on what this is</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={field}
              placeholder="Why someone would open it"
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={submit}
              className="label border border-ink px-6 py-2.5 transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {sections.map((s) => (
        <section key={s} className="mb-12">
          <SectionLabel>{s}</SectionLabel>
          {state.knowledgeLinks
            .filter((k) => k.section === s)
            .map((k) => (
              <a
                key={k.id}
                href={k.url}
                target="_blank"
                rel="noreferrer"
                className="hairline-b hover-tint group flex items-baseline gap-6 py-4"
              >
                <span className="w-52 shrink-0">{k.title}</span>
                <span className="min-w-0 flex-1 truncate text-mid">{k.note}</span>
                <span className="label shrink-0 text-mid">{personName(state, k.ownerId)}</span>
                <span className="label shrink-0 text-mid">↗</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeKnowledgeLink(k.id);
                  }}
                  className="label shrink-0 text-mid opacity-0 transition-opacity duration-150 hover:text-ink group-hover:opacity-100"
                  aria-label="remove link"
                >
                  Remove
                </button>
              </a>
            ))}
        </section>
      ))}
    </div>
  );
}
