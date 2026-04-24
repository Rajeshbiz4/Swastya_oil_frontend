import React from 'react';
import './Popup.css';

type PopupType = 'success' | 'error' | 'warning' | 'info';

interface PopupProps {
  isOpen: boolean;
  type: PopupType;
  title?: string;
  message: string;
  onClose: () => void;
  onOk?: () => void;
  okButtonText?: string;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onOk,
  okButtonText = 'OK'
}) => {
  if (!isOpen) return null;

  const iconMap: Record<PopupType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const handleOkClick = () => {
    if (onOk) {
      onOk();
    }
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="popup-title">
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className={`popup-icon popup-icon-${type}`}>
          {iconMap[type]}
        </div>
        <div className="popup-content">
          {title && <h2 id="popup-title" className="popup-title">{title}</h2>}
          <p className="popup-message">{message}</p>
        </div>
        <div className="popup-actions">
          <button
            className={`popup-button popup-button-${type}`}
            onClick={handleOkClick}
          >
            {okButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
