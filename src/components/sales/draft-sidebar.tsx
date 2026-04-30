"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteDraft } from "@/app/dashboard/sales/actions";
import type { DraftTransactionListItem } from "@/lib/sales/queries";

export function DraftSidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
}: {
  drafts: DraftTransactionListItem[];
  activeDraftId?: string;
  onSelectDraft: (draftId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(event: React.MouseEvent, draftId: string) {
    event.stopPropagation();
    if (!confirm("Delete this draft permanently?")) return;

    startTransition(async () => {
      try {
        await deleteDraft(draftId);
        // If we just deleted the active draft, go back to new sale
        if (draftId === activeDraftId) {
          router.push("/dashboard/sales");
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete draft.");
      }
    });
  }

  return (
    <aside className="draftSidebar">
      <div className="draftSidebar__header">
        <strong>Drafts</strong>
        <span className="draftSidebar__count">{drafts.length}</span>
      </div>

      {drafts.length === 0 ? (
        <p className="draftSidebar__empty">No saved drafts.</p>
      ) : (
        <div className="draftSidebar__list">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="draftSidebar__item"
              data-active={draft.id === activeDraftId}
              role="button"
              tabIndex={0}
              onClick={() => !isPending && onSelectDraft(draft.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isPending) onSelectDraft(draft.id);
                }
              }}
            >
              <div className="draftSidebar__itemInfo">
                <strong>#{draft.transaction_number}</strong>
                <span className="muted">
                  {new Date(draft.created_at).toLocaleString()}
                </span>
              </div>
              <button
                className="draftSidebar__deleteBtn"
                disabled={isPending}
                title="Delete draft"
                type="button"
                onClick={(e) => handleDelete(e, draft.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
