import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusTextColors = {
    "Locate Pending": "text-yellow-600 dark:text-yellow-400",
    "PO Pending": "text-orange-600 dark:text-orange-400",
    "PO Sent": "text-blue-600 dark:text-blue-400",
    "PO Confirmed": "text-blue-500 dark:text-blue-300",
    "Vendor Payment Pending": "text-red-600 dark:text-red-400",
    "Vendor Payment Confirmed": "text-green-600 dark:text-green-400",
    "Shipping Pending": "text-purple-600 dark:text-purple-400",
    "Ship Out": "text-indigo-600 dark:text-indigo-400",
    Intransit: "text-teal-600 dark:text-teal-400",
    Delivered: "text-green-700 dark:text-green-500",
    Replacement: "text-pink-600 dark:text-pink-400",
    default: "text-gray-600 dark:text-gray-400",
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch order details");
        }
        const data = await response.json();
        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Order Details - #{order.order_id}</h1>
        <button
          onClick={() => navigate("/home/orders")}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 text-sm font-medium"
        >
          Back to Orders
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6">
        {/* Order Information */}
 Synthia
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p><strong>Order ID:</strong> {order.order_id || "N/A"}</p>
              <p><strong>Client Name:</strong> {order.clientName || "N/A"}</p>
              <p><strong>Phone:</strong> {order.phone || "N/A"}</p>
              <p><strong>Email:</strong> {order.email || "N/A"}</p>
              <p><strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
              <p><strong>Status:</strong> <span className={`font-semibold ${statusTextColors[order.status] || statusTextColors.default}`}>{order.status || "Unknown"}</span></p>
            </div>
            <div>
              <p><strong>Make:</strong> {order.make || "N/A"}</p>
              <p><strong>Model:</strong> {order.model || "N/A"}</p>
              <p><strong>Year:</strong> {order.year || "N/A"}</p>
              <p><strong>Amount:</strong> ${order.amount?.toFixed(2) || "N/A"}</p>
              <p><strong>Pictures Received from Yard:</strong> {order.picturesReceivedFromYard ? "Yes" : "No"}</p>
              <p><strong>Pictures Sent to Customer:</strong> {order.picturesSentToCustomer ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p><strong>Card Number:</strong> {`**** **** **** ${order.cardNumber?.slice(-4)}` || "N/A"}</p>
              <p><strong>Card Expiry:</strong> {`${order.cardMonth}/${order.cardYear}` || "N/A"}</p>
              <p><strong>CVV:</strong> {order.cvv ? "***" : "N/A"}</p>
            </div>
            <div>
              <p><strong>Billing Address:</strong> {order.billingAddress || "N/A"}</p>
              <p><strong>City:</strong> {order.city || "N/A"}</p>
              <p><strong>State:</strong> {order.state || "N/A"}</p>
              <p><strong>Zip:</strong> {order.zip || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p><strong>Shipping Address:</strong> {order.shippingAddress || "N/A"}</p>
              <p><strong>City:</strong> {order.shippingCity || "N/A"}</p>
              <p><strong>State:</strong> {order.shippingState || "N/A"}</p>
              <p><strong>Zip:</strong> {order.shippingZip || "N/A"}</p>
            </div>
            <div>
              <p><strong>Carrier Name:</strong> {order.carrierName || "N/A"}</p>
              <p><strong>Tracking Number:</strong> {order.trackingNumber || "N/A"}</p>
              <p><strong>BOL Number:</strong> {order.bolNumber || "N/A"}</p>
              <p><strong>Tracking Link:</strong> {order.trackingLink ? <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{order.trackingLink}</a> : "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Weight and Dimensions */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Weight and Dimensions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p><strong>Weight:</strong> {order.weightAndDimensions?.weight ? `${order.weightAndDimensions.weight} lbs` : "N/A"}</p>
              <p><strong>Height:</strong> {order.weightAndDimensions?.height ? `${order.weightAndDimensions.height} in` : "N/A"}</p>
              <p><strong>Width:</strong> {order.weightAndDimensions?.width ? `${order.weightAndDimensions.width} in` : "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        {order.vendors && order.vendors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Vendor Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    {["Business Name", "Agent Name", "Phone", "Email", "Cost Price", "Shipping Cost", "Core Price", "Total Cost", "Rating", "Warranty", "Mileage", "PO Status", "Confirmed"].map((header) => (
                      <th key={header} className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-sm sm:text-base">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.vendors.map((vendor, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.businessName || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.agentName || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.phoneNumber || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.email || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${vendor.costPrice?.toFixed(2) || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${vendor.shippingCost?.toFixed(2) || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${vendor.corePrice?.toFixed(2) || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${vendor.totalCost?.toFixed(2) || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.rating || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.warranty || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.mileage ? `${vendor.mileage} miles` : "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.poStatus || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{vendor.isConfirmed ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && order.notes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Notes</h2>
            <ul className="list-disc pl-5">
              {order.notes.map((note, index) => (
                <li key={index} className="mb-2">
                  <p>{note.text}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(note.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Procurement Notes */}
        {order.procurementnotes && order.procurementnotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Procurement Notes</h2>
            <ul className="list-disc pl-5">
              {order.procurementnotes.map((note, index) => (
                <li key={index} className="mb-2">
                  <p>{note.text}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(note.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;