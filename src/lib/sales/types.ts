export type TransactionStatus = "draft" | "completed" | "cancelled";

export type DiscountType = "fixed" | "percentage";

export type PaymentMethod = "cash" | "gcash";

export type Department = "design_dept" | "physical_dept" | "dev_dept";

export type SaleDiscountInput = {
  type: DiscountType;
  value: number;
};

export type SaleAddOnInput = {
  id: string;
  addOnId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type SaleMaterialInput = {
  id: string;
  inventoryItemId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  addOns: SaleAddOnInput[];
};

export type SaleServiceLineInput = {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  materials: SaleMaterialInput[];
};

export type SaleDeliveryInput = {
  enabled: boolean;
  customerName: string;
  address: string;
  dropOffLocation: string;
  deliveryFee: number;
};

export type SalePaymentInput =
  | { method: "cash"; cashReceived: number }
  | { method: "gcash"; amountPaid: number };

export type DraftSaleInput = {
  transactionId?: string;
  transactionNumber?: number;
  department: Department;
  cashierName: string;
  status: TransactionStatus;
  serviceLines: SaleServiceLineInput[];
  discount: SaleDiscountInput | null;
  delivery: SaleDeliveryInput;
  payment: SalePaymentInput | null;
};

export type CompletionValidationResult = {
  isValid: boolean;
  errors: string[];
};
