import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Import useTheme to support dark/light mode

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  confirmButtonProps = {}, 
  cancelButtonProps = {}, 
  secondaryText, 
  secondaryOnClick, 
  secondaryButtonProps = {} 
}) => {
  const { theme } = useTheme(); // Get current theme
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10); // Trigger animation
    } else {
      setIsAnimating(false); // Reset animation
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: isAnimating ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-xs"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: isAnimating ? 0 : -50, opacity: isAnimating ? 1 : 0 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 ${cancelButtonProps.className || ''}`}
            {...cancelButtonProps}
          >
            {cancelText}
          </button>
          {secondaryText && (
            <button
              onClick={secondaryOnClick}
              className={`px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700 ${secondaryButtonProps.className || ''}`}
              {...secondaryButtonProps}
            >
              {secondaryText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700 ${confirmButtonProps.className || ''}`}
            {...confirmButtonProps}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationModal;