import { appConfig } from '../../../config/appConfig';
import { InvoiceProduct } from '../types/invoice.types';

export const calculateProductTotal = (product: InvoiceProduct): number => {
  return Number(product.total) || Number(product.rate) * Number(product.qty);
};

export const calculateGrandTotal = (products: InvoiceProduct[]): number => {
  return products.reduce((sum, product) => {
    return sum + calculateProductTotal(product);
  }, 0);
};

export const getGstPercent = (): number => {
  return appConfig.tax.cgst + appConfig.tax.sgst;
};

export const calculateTaxableAmount = (inclusiveTotal: number): number => {
  const gstPercent = getGstPercent();
  return inclusiveTotal / (1 + gstPercent / 100);
};

export const calculateInvoiceTotals = (products: InvoiceProduct[]) => {
  const gstPercent = getGstPercent();

  const taxable = products.reduce((sum, product) => {
    const total = calculateProductTotal(product);
    return sum + total / (1 + gstPercent / 100);
  }, 0);

  const cgst = taxable * (appConfig.tax.cgst / 100);
  const sgst = taxable * (appConfig.tax.sgst / 100);
  const totalTax = cgst + sgst;
  const finalTotal = taxable + totalTax;

  return {
    taxable,
    cgst,
    sgst,
    totalTax,
    finalTotal,
  };
};

export const mapInvoiceToPdfData = (invoice: any) => {
  return {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    customerName: invoice.customerName,
    contact: invoice.contact,
    address: invoice.address,
    gstNo: invoice.gstNo || '-',
    note: invoice.note || invoice.remarks || '',
    products: (invoice.products || []).map((product: any) => ({
      oilType: product.oilType,
      type: product.type,
      rate: Number(product.rate),
      qty: Number(product.qty),
      total: Number(product.total) || Number(product.rate) * Number(product.qty),
    })),
  };
};