// components/ConfirmModal.jsx
import React, { useState, useEffect } from 'react';

const ConfirmModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sub, setSub] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  useEffect(() => {
    window.openConfirm = (title, sub, onConfirm) => {
      setTitle(title);
      setSub(sub);
      setOnConfirm(() => onConfirm);
      setIsOpen(true);
    };
    window.closeConfirm = () => {
      setIsOpen(false);
    };
  }, []);

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" id="confirmModal">
      <div className="modal confirm-box">
        <div className="modal-body">
          <div className="ic">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </div>
          <h3 id="confirmTitle">{title}</h3>
          <p id="confirmSub">{sub}</p>
        </div>
        <div className="modal-foot" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
          <button className="btn btn-danger-ghost" onClick={handleConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;