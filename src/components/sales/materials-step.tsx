import type {
  DraftSaleInput,
  SaleAddOnInput,
  SaleMaterialInput,
} from "@/lib/sales/types";
import type { SalesSetupData } from "@/lib/sales/queries";
import { NumericInput } from "./numeric-input";

export function MaterialsStep({
  sale,
  inventoryItems,
  addOns,
  pricingReferences,
  onChange,
}: {
  sale: DraftSaleInput;
  inventoryItems: SalesSetupData["inventoryItems"];
  addOns: SalesSetupData["addOns"];
  pricingReferences: SalesSetupData["pricingReferences"];
  onChange: (sale: DraftSaleInput) => void;
}) {
  function updateSale(
    updater: (current: DraftSaleInput) => DraftSaleInput,
  ) {
    onChange(updater(sale));
  }

  function addMaterial(serviceLineId: string) {
    updateSale((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === serviceLineId
          ? {
              ...line,
              materials: [
                ...line.materials,
                {
                  id: crypto.randomUUID(),
                  inventoryItemId: "",
                  materialName: "",
                  quantity: 1,
                  unitPrice: 0,
                  addOns: [],
                },
              ],
            }
          : line,
      ),
    }));
  }

  function updateMaterial(
    serviceLineId: string,
    materialId: string,
    updates: Partial<SaleMaterialInput>,
  ) {
    updateSale((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === serviceLineId
          ? {
              ...line,
              materials: line.materials.map((material) =>
                material.id === materialId
                  ? { ...material, ...updates }
                  : material,
              ),
            }
          : line,
      ),
    }));
  }

  function removeMaterial(serviceLineId: string, materialId: string) {
    updateSale((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === serviceLineId
          ? {
              ...line,
              materials: line.materials.filter(
                (material) => material.id !== materialId,
              ),
            }
          : line,
      ),
    }));
  }

  function toggleAddOn(
    serviceLineId: string,
    materialId: string,
    addOnId: string,
    checked: boolean,
  ) {
    const addOn = addOns.find((item) => item.id === addOnId);

    if (!addOn) {
      return;
    }

    const nextAddOns = (existing: SaleAddOnInput[]) =>
      checked
        ? [
            ...existing,
            {
              id: crypto.randomUUID(),
              addOnId: addOn.id,
              name: addOn.name,
              quantity: 1,
              unitPrice: 0,
            },
          ]
        : existing.filter((item) => item.addOnId !== addOn.id);

    updateSale((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === serviceLineId
          ? {
              ...line,
              materials: line.materials.map((material) =>
                material.id === materialId
                  ? { ...material, addOns: nextAddOns(material.addOns) }
                  : material,
              ),
            }
          : line,
      ),
    }));
  }

  function updateAddOn(
    serviceLineId: string,
    materialId: string,
    addOnId: string,
    updates: Partial<SaleAddOnInput>,
  ) {
    updateSale((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === serviceLineId
          ? {
              ...line,
              materials: line.materials.map((material) =>
                material.id === materialId
                  ? {
                      ...material,
                      addOns: material.addOns.map((item) =>
                        item.id === addOnId ? { ...item, ...updates } : item,
                      ),
                    }
                  : material,
              ),
            }
          : line,
      ),
    }));
  }

  return (
    <div className="salesStep">
      <div className="salesSectionHeader">
        <div>
          <h2>Materials and Add-ons</h2>
          <p className="muted">
            Choose one or more materials for each service line and optionally
            attach add-ons per material.
          </p>
        </div>
      </div>

      {sale.serviceLines.map((line) => (
        <div key={line.id} className="salesCard">
          <div className="salesCardHeader">
            <div>
              <strong>{line.serviceName || "Unnamed service line"}</strong>
              <div className="muted">
                {line.materials.length} material
                {line.materials.length === 1 ? "" : "s"}
              </div>
            </div>
            <button
              className="buttonSecondary"
              type="button"
              onClick={() => addMaterial(line.id)}
            >
              Add material
            </button>
          </div>

          {line.materials.length === 0 ? (
            <div className="salesEmpty">
              No materials yet for this service line.
            </div>
          ) : null}

          {line.materials.map((material) => {
            const inventoryItem = inventoryItems.find(
              (item) => item.id === material.inventoryItemId,
            );
            const stockWarning =
              inventoryItem &&
              (material.quantity > inventoryItem.stock_on_hand ||
                inventoryItem.stock_on_hand <= inventoryItem.low_stock_threshold);

            // Only show materials linked to the selected service
            const availableMaterials = inventoryItems.filter((item) =>
              pricingReferences.some(
                (ref) =>
                  ref.service_id === line.serviceId &&
                  ref.inventory_item_id === item.id,
              ),
            );

            return (
              <div key={material.id} className="salesMaterialCard">
                <div className="salesCardHeader">
                  <strong>{material.materialName || "New material"}</strong>
                  <button
                    className="buttonSecondary"
                    type="button"
                    onClick={() => removeMaterial(line.id, material.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="salesFieldGrid">
                  <label className="salesField">
                    <span>Material</span>
                    <select
                      value={material.inventoryItemId}
                      onChange={(event) => {
                        const selectedInventoryItem = inventoryItems.find(
                          (item) => item.id === event.target.value,
                        );
                        const suggestedPrice =
                          pricingReferences.find(
                            (reference) =>
                              reference.service_id === line.serviceId &&
                              reference.inventory_item_id === event.target.value,
                          )?.suggested_unit_price ?? material.unitPrice;

                        updateMaterial(line.id, material.id, {
                          inventoryItemId: event.target.value,
                          materialName: selectedInventoryItem?.name ?? "",
                          unitPrice: suggestedPrice,
                        });
                      }}
                    >
                      <option value="">Select material</option>
                      {availableMaterials.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="salesField">
                    <span>Quantity</span>
                    <NumericInput
                      min="0"
                      step="1"
                      value={material.quantity}
                      onChange={(value) =>
                        updateMaterial(line.id, material.id, {
                          quantity: value,
                        })
                      }
                    />
                  </label>

                  <label className="salesField">
                    <span>Suggested / Override Price</span>
                    <NumericInput
                      min="0"
                      step="0.01"
                      value={material.unitPrice}
                      onChange={(value) =>
                        updateMaterial(line.id, material.id, {
                          unitPrice: value,
                        })
                      }
                    />
                  </label>
                </div>

                {stockWarning ? (
                  <div className="salesAlert">
                    Stock warning for {inventoryItem.name}: on hand{" "}
                    {inventoryItem.stock_on_hand}, threshold{" "}
                    {inventoryItem.low_stock_threshold}. The sale can still
                    continue.
                  </div>
                ) : null}

                <div className="salesAddOnGrid">
                  {addOns.map((addOn) => {
                    const selectedAddOn = material.addOns.find(
                      (item) => item.addOnId === addOn.id,
                    );

                    return (
                      <div key={addOn.id} className="salesAddOnRow">
                        <label className="salesCheckbox">
                          <input
                            checked={Boolean(selectedAddOn)}
                            type="checkbox"
                            onChange={(event) =>
                              toggleAddOn(
                                line.id,
                                material.id,
                                addOn.id,
                                event.target.checked,
                              )
                            }
                          />
                          <span>{addOn.name}</span>
                        </label>

                        {selectedAddOn ? (
                          <div className="salesFieldGrid">
                            <label className="salesField">
                              <span>Add-on Qty</span>
                              <NumericInput
                                min="0"
                                step="1"
                                value={selectedAddOn.quantity}
                                onChange={(value) =>
                                  updateAddOn(line.id, material.id, selectedAddOn.id, {
                                    quantity: value,
                                  })
                                }
                              />
                            </label>

                            <label className="salesField">
                              <span>Add-on Price</span>
                              <NumericInput
                                min="0"
                                step="0.01"
                                value={selectedAddOn.unitPrice}
                                onChange={(value) =>
                                  updateAddOn(line.id, material.id, selectedAddOn.id, {
                                    unitPrice: value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
