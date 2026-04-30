import type { SaleServiceLineInput } from "@/lib/sales/types";

export function ServicesStep({
  serviceLines,
  availableCategories,
  availableServices,
  onChange,
}: {
  serviceLines: SaleServiceLineInput[];
  availableCategories: { id: string; name: string }[];
  availableServices: { id: string; name: string; category_id: string | null }[];
  onChange: (serviceLines: SaleServiceLineInput[]) => void;
}) {
  function addServiceLine() {
    onChange([
      ...serviceLines,
      {
        id: crypto.randomUUID(),
        categoryId: "",
        categoryName: "",
        serviceId: "",
        serviceName: "",
        materials: [],
      },
    ]);
  }

  function updateServiceLine(
    lineId: string,
    updates: Partial<SaleServiceLineInput>,
  ) {
    onChange(
      serviceLines.map((line) =>
        line.id === lineId ? { ...line, ...updates } : line,
      ),
    );
  }

  function removeServiceLine(lineId: string) {
    onChange(serviceLines.filter((line) => line.id !== lineId));
  }

  return (
    <div className="salesStep">
      <div className="salesSectionHeader">
        <div>
          <h2>Services</h2>
          <p className="muted">
            Add one or more service lines for this transaction.
          </p>
        </div>
        <button className="buttonSecondary" type="button" onClick={addServiceLine}>
          Add service
        </button>
      </div>

      {serviceLines.length === 0 ? (
        <div className="salesEmpty">
          No service lines yet. Add one to start the transaction.
        </div>
      ) : null}

      {serviceLines.map((line, index) => {
        const filteredServices = line.categoryId
          ? availableServices.filter((s) => s.category_id === line.categoryId)
          : [];

        return (
          <div key={line.id} className="salesCard">
            <div className="salesCardHeader">
              <strong>Service Line {index + 1}</strong>
              <button
                className="buttonSecondary"
                type="button"
                onClick={() => removeServiceLine(line.id)}
              >
                Remove
              </button>
            </div>

            <div className="salesFieldGrid">
              <label className="salesField">
                <span>General Service</span>
                <select
                  value={line.categoryId}
                  onChange={(event) => {
                    const category = availableCategories.find(
                      (cat) => cat.id === event.target.value,
                    );

                    updateServiceLine(line.id, {
                      categoryId: event.target.value,
                      categoryName: category?.name ?? "",
                      // Reset specific service when category changes
                      serviceId: "",
                      serviceName: "",
                      materials: [],
                    });
                  }}
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="salesField">
                <span>Specific Service</span>
                <select
                  value={line.serviceId}
                  disabled={!line.categoryId}
                  onChange={(event) => {
                    const service = filteredServices.find(
                      (item) => item.id === event.target.value,
                    );

                    updateServiceLine(line.id, {
                      serviceId: event.target.value,
                      serviceName: service?.name ?? "",
                      // Reset materials when service changes
                      materials: [],
                    });
                  }}
                >
                  <option value="">
                    {line.categoryId ? "Select a service" : "Choose a category first"}
                  </option>
                  {filteredServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
