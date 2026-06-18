"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteTransaction, completeSale, saveDraft } from "@/app/dashboard/sales/actions";
import {
  calculateFinalTotal,
  calculateSubtotal,
} from "@/lib/sales/calculations";
import type { SalesSetupData } from "@/lib/sales/queries";
import type { DraftSaleInput, Department } from "@/lib/sales/types";

import { DeliveryDiscountStep } from "./delivery-discount-step";
import { MaterialsStep } from "./materials-step";
import { PaymentReviewStep } from "./payment-review-step";
import { ServicesStep } from "./services-step";
import { CashierSelect } from "./cashier-select";
import { getWizardSteps } from "./wizard-config";

function buildEmptySale(department: Department): DraftSaleInput {
  return {
    department,
    cashierName: "",
    status: "draft",
    serviceLines: [],
    discount: null,
    delivery: {
      enabled: false,
      customerName: "",
      address: "",
      dropOffLocation: "",
      deliveryFee: 0,
    },
    payment: null,
  };
}

export function SalesWizard({
  mode,
  department,
  setupData,
  initialSale,
  sale: externalSale,
  onSaleChange,
  activeStaff,
}: {
  mode: "create" | "edit";
  department: Department;
  setupData: SalesSetupData;
  initialSale?: DraftSaleInput | null;
  sale?: DraftSaleInput;
  onSaleChange?: (sale: DraftSaleInput) => void;
  activeStaff?: string[];
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const steps = getWizardSteps(department);

  // Support both controlled (from SalesWorkspace) and uncontrolled (from [transactionId] page) modes
  const [internalSale, setInternalSale] = useState<DraftSaleInput>(
    initialSale ?? buildEmptySale(department),
  );
  const sale = externalSale ?? internalSale;
  const setSale = onSaleChange ?? setInternalSale;
  const isLocked = sale.status === "completed";

  const subtotal = calculateSubtotal(sale);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: sale.discount,
    deliveryFee: sale.delivery.enabled ? sale.delivery.deliveryFee : 0,
  });

  function updateSale(nextSale: DraftSaleInput) {
    setSale(nextSale);
    setErrors([]);
    setMessage(null);
  }

  function handleSaveDraft() {
    startTransition(async () => {
      try {
        const result = await saveDraft(sale);

        if (!result.ok) {
          setErrors(result.errors);
          return;
        }

        setSale({
          ...sale,
          transactionId: result.transactionId,
          transactionNumber: result.transactionNumber ?? undefined,
        });
        setMessage(
          result.transactionNumber
            ? `Draft saved as #${result.transactionNumber}.`
            : "Draft saved.",
        );
        router.refresh();
      } catch (error) {
        setErrors([
          error instanceof Error ? error.message : "Failed to save draft.",
        ]);
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        if (sale.transactionId) {
          await deleteTransaction(sale.transactionId);
        }

        setMessage("Transaction deleted.");
        
        if (mode === "create") {
          setSale({ ...buildEmptySale(department), cashierName: sale.cashierName });
          setCurrentStep(0);
        } else {
          router.push("/dashboard/sales");
        }
        
        router.refresh();
      } catch (error) {
        setErrors([
          error instanceof Error
            ? error.message
            : "Failed to cancel transaction.",
        ]);
      }
    });
  }

  function handleComplete() {
    startTransition(async () => {
      try {
        const result = await completeSale(sale);

        if (!result.ok) {
          setErrors(result.errors);
          return;
        }

        setErrors([]);
        
        if (mode === "create") {
          setSale({ ...buildEmptySale(department), cashierName: sale.cashierName });
          setCurrentStep(0);
        } else {
          router.push("/dashboard/sales");
        }
        
        router.refresh();
      } catch (error) {
        setErrors([
          error instanceof Error ? error.message : "Failed to complete sale.",
        ]);
      }
    });
  }

  // Map step index to actual step content
  function renderStep(stepIndex: number) {
    const step = steps[stepIndex];
    if (!step) return null;

    switch (step.id) {
      case "services":
        return (
          <ServicesStep
            availableCategories={setupData.serviceCategories}
            availableServices={setupData.services}
            serviceLines={sale.serviceLines}
            onChange={(serviceLines) => updateSale({ ...sale, serviceLines })}
          />
        );
      case "materials":
        return (
          <MaterialsStep
            addOns={setupData.addOns}
            inventoryItems={setupData.inventoryItems}
            pricingReferences={setupData.pricingReferences}
            sale={sale}
            onChange={updateSale}
          />
        );
      case "delivery":
        return <DeliveryDiscountStep sale={sale} onChange={updateSale} />;
      case "payment":
        return (
          <PaymentReviewStep
            errors={errors}
            finalTotal={finalTotal}
            message={message}
            pending={isPending || isLocked}
            sale={sale}
            subtotal={subtotal}
            onCancel={handleCancel}
            onChange={updateSale}
            onComplete={handleComplete}
            onSaveDraft={handleSaveDraft}
          />
        );
      default:
        return null;
    }
  }

  return (
    <section className="panel salesPanel">
      <div className="salesToolbar">
        <div className="salesIdentity">
          <div className="salesMeta">
            {mode === "create" ? "Creating a new sale" : "Editing a saved draft"}
          </div>
          <label className="salesField">
            <span>Cashier / Staff</span>
            {department === "physical_dept" ? (
              <CashierSelect
                value={sale.cashierName}
                onChange={(cashierName) => updateSale({ ...sale, cashierName })}
                preSelected={activeStaff}
              />
            ) : (
              <input
                type="text"
                value={sale.cashierName}
                onChange={(event) =>
                  updateSale({ ...sale, cashierName: event.target.value })
                }
              />
            )}
          </label>
          <div className="salesMeta">
            {sale.transactionNumber ? `Transaction #${sale.transactionNumber}` : "Unsaved transaction"}
          </div>
          {isLocked ? <div className="salesNotice">Completed transactions are locked.</div> : null}
        </div>
      </div>

      <fieldset className="salesFieldset" disabled={isPending || isLocked}>
        <div className="salesStepper">
          {steps.map((step, index) => (
            <button
              key={step.id}
              className="salesStepBadge"
              data-active={index === currentStep}
              disabled={isLocked}
              type="button"
              onClick={() => setCurrentStep(index)}
            >
              <strong>{index + 1}</strong>
              <span>{step.label}</span>
            </button>
          ))}
        </div>

        {renderStep(currentStep)}

        <div className="hero__actions">
          <button
            className="buttonSecondary"
            disabled={currentStep === 0 || isPending || isLocked}
            type="button"
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          >
            Back
          </button>
          <button
            className="button"
            disabled={currentStep === steps.length - 1 || isPending || isLocked}
            type="button"
            onClick={() =>
              setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
            }
          >
            Next
          </button>
        </div>
      </fieldset>
    </section>
  );
}
