import type { SaleServiceLineInput } from "@/lib/sales/types";

export function ServicesStep({
  serviceLines,
  availableServices,
  onChange,
}: {
  serviceLines: SaleServiceLineInput[];
  availableServices: { id: string; name: string }[];
  onChange: (serviceLines: SaleServiceLineInput[]) => void;
}) {
  function addServiceLine() {
    const defaultService = availableServices[0];

    onChange([
      ...serviceLines,
      {
        id: crypto.randomUUID(),
        serviceId: defaultService?.id ?? "",
        serviceName: defaultService?.name ?? "",
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

      {serviceLines.map((line, index) => (
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

          <label className="salesField">
            <span>Service</span>
            <select
              value={line.serviceId}
              onChange={(event) => {
                const service = availableServices.find(
                  (item) => item.id === event.target.value,
                );

                updateServiceLine(line.id, {
                  serviceId: event.target.value,
                  serviceName: service?.name ?? "",
                });
              }}
            >
              <option value="">Select a service</option>
              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}
