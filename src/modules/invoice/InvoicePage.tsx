import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Popup from '../../components/UI/Popup';
import { useAppSelector } from '../../store';
import {
  fetchInvoices,
  updateInvoiceStatus,
} from '../../store/slices/invoiceSlice';
import { fetchFinishedGoodsInventory } from '../../store/slices/inventorySlice';
import './InvoicePage.css';
import '../../pages/Pages.css';
import InvoiceTable from './components/InvoiceTable';
import InvoicePreviewModal from './components/InvoicePreviewModal';
import { useInvoicePdf } from './hooks/useInvoicePdf';
import { Invoice } from './types/invoice.types';
import { mapInvoiceToPdfData } from './utils/invoiceCalculations';

const InvoicePage: React.FC = () => {
  const dispatch = useDispatch<any>();

  const { invoices, loading, error } = useAppSelector((state: any) => state.invoice);

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const {
    pdfUrl,
    showPreview,
    setShowPreview,
    openPreview,
    downloadInvoice,
    shareInvoiceOnWhatsApp,
  } = useInvoicePdf(setPopup);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchFinishedGoodsInventory());
  }, [dispatch]);

  const handleViewInvoice = (invoice: Invoice) => {
    openPreview(mapInvoiceToPdfData(invoice));
  };

  const handleSettleInvoice = async (invoice: Invoice) => {
    try {
      const result = await dispatch(
        updateInvoiceStatus({
          id: invoice._id,
          status: 'completed',
        })
      );

      if (updateInvoiceStatus.rejected.match(result)) {
        throw new Error(result.payload || 'Failed to settle invoice');
      }

      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Payment Settled',
        message: 'Invoice marked as settled successfully.',
      });
    } catch (err: any) {
      console.error('Error settling invoice:', err);

      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to settle invoice.',
      });
    }
  };

  return (
    <div className="module-page">
      <h1>Invoice Management</h1>

      {error && <div className="error-message">{error}</div>}

      <button
        className="primary-button"
        style={{ marginTop: 10, marginBottom: 10 }}
        onClick={() => {
          // Next step: open InvoiceForm component
          console.log('Create invoice clicked');
        }}
      >
        + Create Invoice
      </button>

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        onView={handleViewInvoice}
        onSettle={handleSettleInvoice}
      />

      {showPreview && (
        <InvoicePreviewModal
          pdfUrl={pdfUrl}
          onClose={() => setShowPreview(false)}
          onDownload={downloadInvoice}
          onShare={shareInvoiceOnWhatsApp}
        />
      )}

      <Popup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
      />
    </div>
  );
};

export default InvoicePage;