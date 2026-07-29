import { useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import { isOpen, personName } from "../lib";
import { DueTag, EmptyState, SectionLabel, StatusTag } from "../ui";
import CommitmentPanel from "../CommitmentPanel";

/** Anything without an owner or without a due date. Visible and slightly embarrassing. */
export default function Unowned() {
  const { state, updateCommitment } = useStore();
  const [params, setParams] = useSearchParams();
  const openId = params.get("open");

  const open = state.commitments.filter((c) => isOpen(c.status));
  const noOwner = open.filter((c) => !c.ownerId);
  const noDate = open.filter((c) => c.ownerId && !c.dueDate);

  const total = noOwner.length + noDate.length;

  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-12">
        <h1 className="label-lg">Unowned</h1>
        <p className="mt-2 text-mid">
          {total === 0
            ? "Everything has an owner and a date. Rare. Enjoy it."
            : `${total} commitment${total === 1 ? "" : "s"} nobody is on the hook for. This list is meant to be slightly embarrassing.`}
        </p>
      </header>

      {total === 0 && (
        <EmptyState
          title="Clean sheet"
          hint="A commitment without an owner or a date is a wish. Right now there are none."
        />
      )}

      {noOwner.length > 0 && (
        <section className="mb-12">
          <SectionLabel>No owner — {noOwner.length}</SectionLabel>
          {noOwner.map((c) => (
            <div
              key={c.id}
              className="hairline-b hover-tint flex cursor-pointer items-center gap-5 py-4"
              onClick={() => setParams({ open: c.id })}
            >
              <StatusTag status={c.status} />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <select
                defaultValue=""
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (!e.target.value) return;
                  updateCommitment(
                    c.id,
                    { ownerId: e.target.value },
                    `claimed by ${personName(state, e.target.value)}`
                  );
                }}
                className="label appearance-none border-b border-hairline py-1 text-mid"
              >
                <option value="">Claim…</option>
                {state.people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ))}
        </section>
      )}

      {noDate.length > 0 && (
        <section className="mb-12">
          <SectionLabel>No due date — {noDate.length}</SectionLabel>
          {noDate.map((c) => (
            <div
              key={c.id}
              className="hairline-b hover-tint flex cursor-pointer items-center gap-5 py-4"
              onClick={() => setParams({ open: c.id })}
            >
              <StatusTag status={c.status} />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <span className="label text-mid">{personName(state, c.ownerId)}</span>
              <DueTag dueDate={c.dueDate} status={c.status} />
            </div>
          ))}
        </section>
      )}

      {openId && <CommitmentPanel id={openId} onClose={() => setParams({})} />}
    </div>
  );
}
