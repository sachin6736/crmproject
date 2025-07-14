import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
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
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Order {order.order_id || "N/A"}</h1>
          <button
            onClick={() => navigate("/home/litigation-orders")}
            className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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