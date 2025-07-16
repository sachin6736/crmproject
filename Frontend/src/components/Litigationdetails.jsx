import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";

const LitigationDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    vendorNotes: false,
    procurementNotes: false,
    orderNotes: false,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    deliveryDate: "",
    installationDate: "",
    problemOccurredDate: "",
    problemInformedDate: "",
    receivedPictures: false,
    receivedDiagnosticReport: false,
    problemDescription: "",
    resolutionNotes: "",
  });

  // Status color mapping
  const statusTextColors = {
    Litigation: "text-green-600 dark:text-green-400",
    Replacement: "text-orange-600 dark:text-orange-400",
    "Replacement Cancelled": "text-red-600 dark:text-red-400",
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch order");
        }
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error(error.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  // Function to handle status update to "Replacement"
  const handleReplacement = async () => {
    try {
      const response = await fetch(`http://localhost:3000/LiteReplace/updateStatus/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: "Replacement" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder.order); // Update the order state with new data
      toast.success("Order status updated to Replacement");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  // Format address
  const formatAddress = (address, city, state, zip) => {
    if (!address && !city && !state && !zip) return "N/A";
    return `${address || ""}, ${city || ""}, ${state || ""} ${zip || ""}`.trim();
  };

  // Format date
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) : "N/A";
  };

  // Mask card number
  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return "N/A";
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  // Mask CVV
  const maskCVV = (cvv) => {
    return cvv ? "****" : "N/A";
  };

  // Toggle dropdown
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/Order/update-litigation/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update litigation details");
      }
      toast.success("Litigation details updated successfully");
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error updating litigation details:", error);
      toast.error(error.message || "Failed to update litigation details");
    }
  };

  // Close form modal
  const closeForm = () => {
    setIsFormOpen(false);
    setFormData({
      deliveryDate: "",
      installationDate: "",
      problemOccurredDate: "",
      problemInformedDate: "",
      receivedPictures: false,
      receivedDiagnosticReport: false,
      problemDescription: "",
      resolutionNotes: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 borderüd:2C0B0B-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center py-16 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-lg">Order not found</p>
      </div>
    );
  }

  const activeVendor = order.vendors?.find(
    (vendor) => vendor.isConfirmed && vendor.poStatus === "PO Confirmed"
  );

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
        {/* Header with Back and Litigation Form Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Order {order.order_id || "N/A"}</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleReplacement} // Call the new function here
              className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 transition-all duration-200 text-sm font-medium"
            >
              Replacement
            </button>
            <button
              onClick={() => navigate("/home/litigation-orders")}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 text-sm font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Orders
            </button>
          </div>
        </div>

        {/* Litigation Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Update Litigation Details</h2>
                <button
                  onClick={closeForm}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Installation Date</label>
                  <input
                    type="date"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem Occurred Date</label>
                  <input
                    type="date"
                    name="problemOccurredDate"
                    value={formData.problemOccurredDate}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Problem Informed Date</label>
                  <input
                    type="date"
                    name="problemInformedDate"
                    value={formData.problemInformedDate}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      name="receivedPictures"
                      checked={formData.receivedPictures}
                      onChange={handleFormChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    Received Pictures of Defective Part
                  </label>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      name="receivedDiagnosticReport"
                      checked={formData.receivedDiagnosticReport}
                      onChange={handleFormChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    Received Diagnostic Report
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">What's the Problem</label>
                  <textarea
                    name="problemDescription"
                    value={formData.problemDescription}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Notes</label>
                  <textarea
                    name="resolutionNotes"
                    value={formData.resolutionNotes}
                    onChange={handleFormChange}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Name:</p>
              <p>{order.leadId?.clientName || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Phone:</p>
              <p>{order.leadId?.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Email:</p>
              <p>{order.leadId?.email || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Zip Code:</p>
              <p>{order.leadId?.zip || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Status:</p>
              <p className={`${statusTextColors[order.status] || "text-gray-900 dark:text-gray-100"} font-medium`}>
                {order.status || "N/A"}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Date:</p>
              <p>{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Team Information */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Team Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Sales Person:</p>
              <p>{order.salesPerson?.name || "N/A"} ({order.salesPerson?.email || "N/A"})</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Customer Relations Person:</p>
              <p>{order.customerRelationsPerson?.name || "N/A"} ({order.customerRelationsPerson?.email || "N/A"})</p>
            </div>
          </div>
        </div>

        {/* Billing and Shipping Address */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Billing and Shipping Address</h2>
          <div className= "grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Billing Address:</p>
              <p>{formatAddress(order.billingAddress, order.city, order.state, order.zip)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Shipping Address:</p>
              <p>{formatAddress(order.shippingAddress, order.shippingCity, order.shippingState, order.shippingZip)}</p>
            </div>
          </div>
        </div>

        {/* Part Information */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Part Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Part Requested:</p>
              <p>{order.leadId?.partRequested || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Make:</p>
              <p>{order.leadId?.make || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Model:</p>
              <p>{order.leadId?.model || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Year:</p>
              <p>{order.leadId?.year || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Trim:</p>
              <p>{order.leadId?.trim || "N/A"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Warranty:</p>
              <p>{order.leadId?.warranty || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Active Vendor */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Active Vendor</h2>
          {activeVendor ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Business Name:</p>
                <p>{activeVendor.businessName || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Agent Name:</p>
                <p>{activeVendor.agentName || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Email:</p>
                <p>{activeVendor.email || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Phone:</p>
                <p>{activeVendor.phoneNumber || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Total Cost:</p>
                <p>{activeVendor.totalCost ? `$${activeVendor.totalCost.toFixed(2)}` : "N/A"}</p>
              </div>
              <div className="sm:col-span-2">
                <button
                  onClick={() => toggleSection("vendorNotes")}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <p className="font-medium text-gray-700 dark:text-gray-300">Vendor Notes</p>
                  {openSections.vendorNotes ? (
                    <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
                <div
                  className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    openSections.vendorNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {activeVendor.notes?.length > 0 ? (
                    <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      {activeVendor.notes.map((note, index) => (
                        <li key={index} className="mb-2">
                          {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No notes</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>No active vendor found</p>
          )}
        </div>

        {/* Procurement Notes */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <button
            onClick={() => toggleSection("procurementNotes")}
            className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <h2 className="font-medium text-gray-700 dark:text-gray-300">Procurement Notes</h2>
            {openSections.procurementNotes ? (
              <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <div
            className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
              openSections.procurementNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {order.procurementnotes?.length > 0 ? (
              <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {order.procurementnotes.map((note, index) => (
                  <li key={index} className="mb-2">
                    {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No procurement notes</p>
            )}
          </div>
        </div>

        {/* Order Notes */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection("orderNotes")}
            className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <h2 className="font-medium text-gray-700 dark:text-gray-300">Order Notes</h2>
            {openSections.orderNotes ? (
              <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <div
            className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
              openSections.orderNotes ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {order.notes?.length > 0 ? (
              <ul className="list-disc pl-5 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {order.notes.map((note, index) => (
                  <li key={index} className="mb-2">
                    {note.text} <span className="text-gray-500 dark:text-gray-400 text-sm">({formatDate(note.createdAt)})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">No order notes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LitigationDetails;