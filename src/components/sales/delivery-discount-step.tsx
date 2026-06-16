import { calculateFinalTotal, calculateSubtotal } from "@/lib/sales/calculations";
import type { DraftSaleInput } from "@/lib/sales/types";
import { NumericInput } from "./numeric-input";

export function DeliveryDiscountStep({
  sale,
  onChange,
}: {
  sale: DraftSaleInput;
  onChange: (sale: DraftSaleInput) => void;
}) {
  const subtotal = calculateSubtotal(sale);
  const previewTotal = calculateFinalTotal({
    subtotal,
    discount: sale.discount,
    deliveryFee: sale.delivery.enabled ? sale.delivery.deliveryFee : 0,
  });

  return (
    <div className="salesStep">
      <div className="salesSectionHeader">
        <div>
          <h2>Delivery and Discount</h2>
          <p className="muted">
            Delivery details are only required when delivery is enabled.
          </p>
        </div>
      </div>

      <label className="salesCheckbox">
        <input
          checked={sale.delivery.enabled}
          type="checkbox"
          onChange={(event) =>
            onChange({
              ...sale,
              delivery: {
                ...sale.delivery,
                enabled: event.target.checked,
              },
            })
          }
        />
        <span>Delivery required</span>
      </label>

      {sale.delivery.enabled ? (
        <div className="salesCard">
          <div className="salesFieldGrid">
            <label className="salesField">
              <span>Customer name</span>
              <input
                type="text"
                value={sale.delivery.customerName}
                onChange={(event) =>
                  onChange({
                    ...sale,
                    delivery: {
                      ...sale.delivery,
                      customerName: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="salesField">
              <span>Address</span>
              <input
                type="text"
                value={sale.delivery.address}
                onChange={(event) =>
                  onChange({
                    ...sale,
                    delivery: {
                      ...sale.delivery,
                      address: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="salesField">
              <span>Drop-off location</span>
              <input
                type="text"
                value={sale.delivery.dropOffLocation}
                onChange={(event) =>
                  onChange({
                    ...sale,
                    delivery: {
                      ...sale.delivery,
                      dropOffLocation: event.target.value,
                    },
                  })
                }
              />
            </label>

            <label className="salesField">
              <span>Delivery fee</span>
              <NumericInput
                min="0"
                step="0.01"
                value={sale.delivery.deliveryFee}
                onChange={(value) =>
                  onChange({
                    ...sale,
                    delivery: {
                      ...sale.delivery,
                      deliveryFee: value,
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="salesCard">
        <div className="salesFieldGrid">
          <label className="salesField">
            <span>Discount type</span>
            <select
              value={sale.discount?.type ?? ""}
              onChange={(event) =>
                onChange({
                  ...sale,
                  discount: event.target.value
                    ? {
                        type: event.target.value as "fixed" | "percentage",
                        value: sale.discount?.value ?? 0,
                      }
                    : null,
                })
              }
            >
              <option value="">No discount</option>
              <option value="fixed">Fixed amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </label>

          <label className="salesField">
            <span>Discount value</span>
            <NumericInput
              min="0"
              step="0.01"
              value={sale.discount?.value ?? 0}
              onChange={(value) =>
                onChange({
                  ...sale,
                  discount: sale.discount
                    ? {
                        ...sale.discount,
                        value: value,
                      }
                    : {
                        type: "fixed",
                        value: value,
                      },
                })
              }
            />
          </label>
        </div>
      </div>

      {previewTotal < 0 ? (
        <div className="salesAlert">
          Discount cannot reduce the total below zero.
        </div>
      ) : null}
    </div>
  );
}
