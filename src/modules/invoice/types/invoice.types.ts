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