import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { X } from 'lucide-react';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonProps = {}, cancelButtonProps = {}, secondaryText, secondaryOnClick, secondaryButtonProps = {} }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation when modal opens
      setTimeout(() => setIsAnimating(true), 10); // Small delay to ensure transition
    } else {
      // Reset animation when modal closes
      setIsAnimating(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none"
      overlayClassName={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
      contentLabel={title}
      onAfterOpen={() => setIsAnimating(true)}
      onAfterClose={() => setIsAnimating(false)}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md pointer-events-auto transform transition-all duration-300 ease-in-out ${
          isAnimating && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-lg border border-red-200 dark:border-red-600 hover:border-red-300 dark:hover:border-red-500 transition-colors duration-200 ${cancelButtonProps.className || ''}`}
            {...cancelButtonProps}
          >
            {cancelText}
          </button>
          {secondaryText && (
            <button
              onClick={secondaryOnClick}
              className={`px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${secondaryButtonProps.className || ''}`}
              {...secondaryButtonProps}
            >
              {secondaryText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 ${confirmButtonProps.className || ''}`}
            {...confirmButtonProps}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;