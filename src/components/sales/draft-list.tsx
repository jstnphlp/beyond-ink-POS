import Link from "next/link";

import type { DraftTransactionListItem } from "@/lib/sales/queries";

export function DraftList({ drafts }: { drafts: DraftTransactionListItem[] }) {
  return (
    <section className="panel">
      <h2>Saved Drafts</h2>
      {drafts.length === 0 ? (
        <p className="muted">No draft transactions yet.</p>
      ) : (
        <div className="stack">
          {drafts.map((draft) => (
            <Link key={draft.id} className="panel" href={`/dashboard/sales/${draft.id}`}>
              <strong>#{draft.transaction_number}</strong>
              <div className="muted">
                Created {new Date(draft.created_at).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
