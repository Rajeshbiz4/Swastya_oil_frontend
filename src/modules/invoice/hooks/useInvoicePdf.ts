import { useState } from 'react';
import { generateInvoicePdf } from '../utils/invoicePdf';
import { InvoicePdfData } from '../types/invoice.types';

type PopupSetter = React.Dispatch<
  React.SetStateAction<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>
>;

export const useInvoicePdf = (setPopup: PopupSetter) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] =
    useState<InvoicePdfData | null>(null);

  const openPreview = (invoiceData: InvoicePdfData) => {
    setSelectedInvoiceForPdf(invoiceData);

    const doc = generateInvoicePdf(invoiceData);
    const blobUrl:any = doc.output('bloburl');

    setPdfUrl(blobUrl);
    setShowPreview(true);
  };

  const downloadInvoice = () => {
    if (!selectedInvoiceForPdf) {
      setPopup({
        isOpen: true,
        type: 'warning',
        title: 'Invoice Not Selected',
        message: 'Please open invoice preview before downloading.',
      });
      return;
    }

    const doc = generateInvoicePdf(selectedInvoiceForPdf);
    doc.save(`Invoice_${selectedInvoiceForPdf.invoiceNumber || 'invoice'}.pdf`);
  };

  const shareInvoiceOnWhatsApp = async () => {
    try {
      if (!selectedInvoiceForPdf) {
        setPopup({
          isOpen: true,
          type: 'warning',
          title: 'Invoice Not Selected',
          message: 'Please open invoice preview before sharing.',
        });
        return;
      }

      const doc = generateInvoicePdf(selectedInvoiceForPdf);
      const pdfBlob = doc.output('blob');

      const file = new File(
        [pdfBlob],
        `Invoice_${selectedInvoiceForPdf.invoiceNumber || 'invoice'}.pdf`,
        { type: 'application/pdf' }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Invoice PDF',
          text: `Invoice #${selectedInvoiceForPdf.invoiceNumber} for ${selectedInvoiceForPdf.customerName || 'Customer'}`,
        });

        setPopup({
          isOpen: true,
          type: 'success',
          title: 'Invoice Shared',
          message: 'Invoice PDF shared successfully.',
        });
      } else {
        doc.save(`Invoice_${selectedInvoiceForPdf.invoiceNumber || 'invoice'}.pdf`);

        setPopup({
          isOpen: true,
          type: 'warning',
          title: 'Sharing Not Supported',
          message: 'Direct sharing is not supported. Invoice downloaded instead.',
        });
      }
    } catch (err: any) {
      console.error('Error sharing invoice:', err);

      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Share Failed',
        message: err.message || 'Failed to share invoice PDF.',
      });
    }
  };

  return {
    pdfUrl,
    showPreview,
    setShowPreview,
    openPreview,
    downloadInvoice,
    shareInvoiceOnWhatsApp,
  };
};