import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, onClose, children, wide = false }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content${wide ? ' modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
