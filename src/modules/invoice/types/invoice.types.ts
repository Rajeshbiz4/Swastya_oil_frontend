export type InvoiceStatus = 'pending' | 'completed' | 'failed';

export interface InvoiceProduct {
  oilType: string;
  type: string;
  rate: number;
  qty: number;
  total?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  contact: string;
  address: string;
  gstNo?: string;
  products: InvoiceProduct[];
  note?: string;
  remarks?: string;
  status: InvoiceStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  contact: string;
  address: string;
  gstNo?: string;
  products: InvoiceProduct[];
  note?: string;
}

export interface CreateInvoicePayload {
  invoiceNumber: string;
  date: string;
  customerName: string;
  contact: string;
  address: string;
  gstNo?: string;
  products: InvoiceProduct[];
  note?: string;
  status?: InvoiceStatus;
  createdBy: string;
}

export interface InvoiceProductRateResponse {
  oilType: string;
  selectedPackagingType: string;
  packagingInventoryType: string;
  liters: number;
  oilAverageRate: number;
  oilAmount: number;
  packagingRatePerUnit: number;
  availableQuantity: number;
  finalRate: number;
}
export interface RawOilAverageRateResponse {
  oilType: string;
  averageRate: number;
}

export interface FinishedGoodsQuantityResponse {
  oilType: string;
  packagingType: string;
  availableQuantity: number;
}

export interface PackagingRateResponse {
  selectedPackagingType: string;
  packagingInventoryType: string;
  ratePerUnit: number;
}