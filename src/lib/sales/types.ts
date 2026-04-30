export type TransactionStatus = "draft" | "completed" | "cancelled";

export type DiscountType = "fixed" | "percentage";

export type PaymentMethod = "cash" | "gcash";

export type SaleDiscountInput = {
  type: DiscountType;
  value: number;
};

export type SaleAddonInput = {
  id: string;
  quantity: number;
  unitPrice: number;
  name?: string;
};

export type SaleMaterialInput = {
  id: string;
  quantity: number;
  unitPrice: number;
  name?: string;
  addOns?: SaleAddonInput[];
};

export type ServiceLineInput = {
  id: string;
  serviceId: string;
  materials: SaleMaterialInput[];
  name?: string;
};

export type DeliveryInput = {
  enabled: boolean;
  customerName?: string;
  address?: string;
  dropOffLocation?: string;
  fee?: number;
};

export type PaymentInput = {
  method?: PaymentMethod;
  cashReceived?: number;
  amountPaid?: number;
};

export type DraftSaleInput = {
  cashierName?: string;
  status: TransactionStatus;
  serviceLines: ServiceLineInput[];
  discount?: SaleDiscountInput;
  delivery?: DeliveryInput;
  payment?: PaymentInput;
};

export type CompletionValidationResult = {
  isValid: boolean;
  errors: string[];
};
