import React from "react";
import { toast } from "react-toastify";

const EmailPreviewModal = ({
  isOpen,
  onClose,
  emailContent,
  orderId,
  vendorId,
  onConfirm,
}) => {
  const [isSending, setIsSending] = React.useState(false);

  const handleConfirm = async () => {
    setIsSending(true);
    try {
      const response = await fetch(
        `http://localhost:3000/Order/sendpurchaseorder/${orderId}?vendorId=${vendorId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.status === 403) {
        throw new Error(data.message || "Admin access required");
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to send purchase order");
      }

      toast.success(data.message || "Purchase order sent successfully");
      //onConfirm(); // Close modal and refresh order
    } catch (error) {
      console.error("Error sending purchase order:", error);
      toast.error(error.message || "Failed to send purchase order");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
          Preview Purchase Order Email
        </h3>
        <div
          className="border border-gray-300 dark:border-gray-600 p-4 rounded-md bg-gray-50 dark:bg-gray-700 mb-4"
          dangerouslySetInnerHTML={{ __html: emailContent }}
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;