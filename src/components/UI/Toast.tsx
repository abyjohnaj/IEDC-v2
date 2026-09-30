import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notification show">
      {message}
    </div>
  );
};
