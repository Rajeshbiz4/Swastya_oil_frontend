import React from 'react';

interface InvoicePreviewModalProps {
  pdfUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  pdfUrl,
  onClose,
  onDownload,
  onShare,
}) => {
  if (!pdfUrl) return null;

  return (
    <div className="invoice-preview-overlay">
      <div className="invoice-preview-content">
        <iframe title="PDF Preview" src={pdfUrl} width="100%" height="90%" />

        <div className="invoice-preview-actions">
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>

          <button className="success-button" onClick={onShare}>
            Share on WhatsApp
          </button>

          <button className="primary-button" onClick={onDownload}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;