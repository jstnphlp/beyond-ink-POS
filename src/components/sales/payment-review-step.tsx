import type { DraftSaleInput } from "@/lib/sales/types";

export function PaymentReviewStep({
  sale,
  subtotal,
  finalTotal,
  errors,
  message,
  pending,
  onChange,
  onSaveDraft,
  onComplete,
  onCancel,
}: {
  sale: DraftSaleInput;
  subtotal: number;
  finalTotal: number;
  errors: string[];
  message: string | null;
  pending: boolean;
  onChange: (sale: DraftSaleInput) => void;
  onSaveDraft: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="salesStep">
      <div className="salesSectionHeader">
        <div>
          <h2>Payment and Review</h2>
          <p className="muted">
            Review totals, choose the payment method, then save, cancel, or
            complete the sale.
          </p>
        </div>
      </div>

      <div className="salesCard">
        <div className="salesFieldGrid">
          <label className="salesField">
            <span>Payment method</span>
            <select
              value={sale.payment?.method ?? ""}
              onChange={(event) => {
                if (event.target.value === "cash") {
                  onChange({
                    ...sale,
                    payment: { method: "cash", cashReceived: 0 },
                  });
                  return;
                }

                if (event.target.value === "gcash") {
                  onChange({
                    ...sale,
                    payment: { method: "gcash", amountPaid: 0 },
                  });
                  return;
                }

                onChange({ ...sale, payment: null });
              }}
            >
              <option value="">Select payment method</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </label>

          {sale.payment?.method === "cash" ? (
            <>
              <label className="salesField">
                <span>Cash received</span>
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={sale.payment.cashReceived}
                  onChange={(event) =>
                    onChange({
                      ...sale,
                      payment: {
                        method: "cash",
                        cashReceived: Number(event.target.value) || 0,
                      },
                    })
                  }
                />
              </label>

              <div className="salesStat">
                <span>Change</span>
                <strong>
                  {Math.max(0, sale.payment.cashReceived - finalTotal).toFixed(2)}
                </strong>
              </div>
            </>
          ) : null}

          {sale.payment?.method === "gcash" ? (
            <label className="salesField">
              <span>GCash amount paid</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={sale.payment.amountPaid}
                onChange={(event) =>
                  onChange({
                    ...sale,
                    payment: {
                      method: "gcash",
                      amountPaid: Number(event.target.value) || 0,
                    },
                  })
                }
              />
            </label>
          ) : null}
        </div>
      </div>

      <div className="salesTotals">
        <div className="salesStat">
          <span>Subtotal</span>
          <strong>{subtotal.toFixed(2)}</strong>
        </div>
        <div className="salesStat">
          <span>Discount</span>
          <strong>{sale.discount?.value ?? 0}</strong>
        </div>
        <div className="salesStat">
          <span>Delivery fee</span>
          <strong>
            {sale.delivery.enabled ? sale.delivery.deliveryFee.toFixed(2) : "0.00"}
          </strong>
        </div>
        <div className="salesStat salesStat--total">
          <span>Final total</span>
          <strong>{finalTotal.toFixed(2)}</strong>
        </div>
      </div>

      {message ? <div className="salesNotice">{message}</div> : null}

      {errors.length > 0 ? (
        <div className="salesAlert">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      <div className="hero__actions">
        <button
          className="buttonSecondary"
          disabled={pending}
          type="button"
          onClick={onSaveDraft}
        >
          Save draft
        </button>
        <button
          className="buttonSecondary"
          disabled={pending}
          type="button"
          onClick={onCancel}
        >
          Cancel transaction
        </button>
        <button className="button" disabled={pending} type="button" onClick={onComplete}>
          Complete sale
        </button>
      </div>
    </div>
  );
}
