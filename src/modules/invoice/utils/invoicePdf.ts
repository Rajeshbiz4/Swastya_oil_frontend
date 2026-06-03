import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toWords } from 'number-to-words';
import { appConfig } from '../../../config/appConfig';
import { InvoicePdfData } from '../types/invoice.types';
import {
  calculateInvoiceTotals,
  calculateProductTotal,
  getGstPercent,
} from './invoiceCalculations';

const convertToWords = (num: number) => {
  if (!num) return '';
  const [rupees, paise] = num.toString().split('.');
  let words = toWords(Number(rupees)) + ' rupees';

  if (paise) {
    words += ' and ' + toWords(Number(paise)) + ' paise';
  }

  return words.replace(/\b\w/g, (c) => c.toUpperCase());
};

const getHSNCodeForOilType = (oilType: string): string => {
  const hsnCodes = appConfig.products.hsnCodes;

  switch ((oilType || '').toLowerCase()) {
    case 'coconut_oil':
      return hsnCodes.COCONUT_OIL;
    case 'sunflower_oil':
      return hsnCodes.SUNFLOWER_OIL;
    case 'soyabean_oil':
      return hsnCodes.SOYABEAN_OIL;
    case 'mustard_oil':
      return hsnCodes.MUSTARD_OIL;
    case 'groundnut_oil':
      return hsnCodes.GROUNDNUT_OIL;
    case 'olive_oil':
      return hsnCodes.OLIVE_OIL;
    default:
      return hsnCodes.SOYABEAN_OIL;
  }
};

export const generateInvoicePdf = (data: InvoicePdfData) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.setTextColor(128, 0, 0);
  doc.text(appConfig.company.name, 105, 12, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  doc.text(appConfig.company.address, 105, 17, { align: 'center' });
  doc.text(`Contact: ${appConfig.company.contact}, ${appConfig.company.contact2}`, 10, 22);
  doc.text(`Email: ${appConfig.company.email}`, 105, 22, { align: 'center' });
  doc.text(`PAN: ${appConfig.company.PAN}`, 170, 22, { align: 'right' });

  doc.text(
    `GSTIN: ${appConfig.company.gstNumber} / FSSAI NO: ${appConfig.company.FSSAI_LIC_NO}`,
    105,
    27,
    { align: 'center' }
  );

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 105, 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  doc.rect(10, 38, 95, 32);
  doc.rect(105, 38, 95, 32);

  doc.setFontSize(9);

  doc.setFont('helvetica', 'bold');
  doc.text('Buyer (Bill To)', 12, 44);

  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName || '-', 12, 50);
  doc.text(data.address || '-', 12, 56);
  doc.text(`GSTIN/UIN : ${data.gstNo || '-'}`, 12, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Consignee (Ship To)', 107, 44);

  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName || '-', 107, 50);
  doc.text(data.address || '-', 107, 56);

  doc.rect(10, 70, 190, 16);

  doc.setFontSize(8);
  doc.text(`Invoice No: ${data.invoiceNumber}`, 12, 77);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 80, 77);
  doc.text(`Contact: ${data.contact || '-'}`, 145, 77);

  const gstPercent = getGstPercent();

  const tableBody = data.products.map((product, index) => {
    const total = calculateProductTotal(product);
    const taxableAmount = total / (1 + gstPercent / 100);
    const actualRate = taxableAmount / Number(product.qty || 1);

    return [
      index + 1,
      product.oilType || '-',
      product.type || '-',
      getHSNCodeForOilType(product.oilType),
      product.qty || 0,
      (taxableAmount * (appConfig.tax.cgst / 100)).toFixed(2),
      (taxableAmount * (appConfig.tax.sgst / 100)).toFixed(2),
      actualRate.toFixed(2),
      taxableAmount.toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: 90,
    head: [[
      'Sr',
      'Description of Goods',
      'Packing',
      'HSN/SAC',
      'Qty',
      `CGST (${appConfig.tax.cgst}%)`,
      `SGST (${appConfig.tax.sgst}%)`,
      'Rate',
      'Amount',
    ]],
    body: tableBody,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontStyle: 'bold',
    },
    theme: 'grid',
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 15 },
      8: { halign: 'right', cellWidth: 30 },
    },
  });

  const { taxable, cgst, sgst, totalTax, finalTotal } = calculateInvoiceTotals(data.products);

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: finalY,
    head: [[
      'Taxable Value',
      `CGST (${appConfig.tax.cgst}%)`,
      `SGST (${appConfig.tax.sgst}%)`,
      'Total Tax',
    ]],
    body: [[
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      totalTax.toFixed(2),
    ]],
    foot: [[
      'Total',
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      totalTax.toFixed(2),
    ]],
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      fontStyle: 'bold',
    },
    theme: 'grid',
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total :  ${finalTotal.toFixed(2)}`, 135, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.text(
    `Amount Chargeable (in words): ${convertToWords(Math.round(finalTotal))} Rupees Only`,
    10,
    finalY + 8
  );

  let bankY = finalY + 20;

  doc.setFont('helvetica', 'bold');
  doc.text('BANK DETAILS', 10, bankY);

  doc.setFont('helvetica', 'normal');
  doc.text(`A/C Name : ${appConfig.bank.name}`, 10, bankY + 6);
  doc.text(`Bank : ${appConfig.bank.bank}`, 10, bankY + 12);
  doc.text(`A/C No : ${appConfig.bank.account}`, 10, bankY + 18);
  doc.text(`IFSC : ${appConfig.bank.ifsc}`, 10, bankY + 24);

  let termsY = bankY + 45;

  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 10, termsY);

  doc.setFont('helvetica', 'normal');

  appConfig.terms.forEach((term: string, index: number) => {
    doc.text(`${index + 1}. ${term}`, 10, termsY + 7 + index * 6);
  });

  doc.setFont('helvetica', 'bold');
  doc.text(`For ${appConfig.company.name}`, 145, termsY + 20);
  doc.text('Authorized Signatory', 145, termsY + 45);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a Computer Generated Invoice', 10, 285);

  return doc;
};