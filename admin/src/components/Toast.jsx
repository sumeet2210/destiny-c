// components/Toast.jsx
import React, { useState, useEffect } from 'react';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (msg, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 2600);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-root">
      {toasts.map(({ id, msg, type }) => (
        <div key={id} className={`toast ${type}`}>
          <span className="dot"></span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;