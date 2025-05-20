import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch order data");
        }
        const data = await response.json();
        console.log("Orderdata",data);
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order data:", error);
        toast.error("Failed to load order details");
        navigate("/home/orders"); // Redirect back to orders history on error
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FullPageLoader
            size="w-10 h-10"
            color="text-blue-500 dark:text-blue-400"
            fill="fill-blue-300 dark:fill-blue-600"
          />
        </div>
      ) : order ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Order Details
            </h2>
            <button
             onClick={() => navigate("/home/orders")}
             className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
            Back to Orders
            </button>
          </div>
          <div className="space-y-8 text-gray-900 dark:text-gray-100">
            {/* Customer Information */}
            <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Client Name
                  </strong>
                  <span>{order.clientName || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Phone
                  </strong>
                  <span>{order.phone || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Email
                  </strong>
                  <span>{order.email || "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Vehicle Information */}
            <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Make
                  </strong>
                  <span>{order.make || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Model
                  </strong>
                  <span>{order.model || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Year
                  </strong>
                  <span>{order.year || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Trim
                  </strong>
                  <span>{order.leadId?.trim || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Part Requested
                  </strong>
                  <span>{order.leadId?.partRequested || "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Payment Information */}
            <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Card Last Four
                  </strong>
                  <span>{order.cardLastFour || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Card Expiry
                  </strong>
                  <span>
                    {order.cardMonth && order.cardYear
                      ? `${order.cardMonth}/${order.cardYear}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Part Cost
                  </strong>
                  <span>
                    {order.leadId?.partCost
                      ? `$${order.leadId.partCost.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Cost
                  </strong>
                  <span>
                    {order.leadId?.shippingCost
                      ? `$${order.leadId.shippingCost.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Gross Profit
                  </strong>
                  <span>
                    {order.leadId?.grossProfit
                      ? `$${order.leadId.grossProfit.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Total Cost
                  </strong>
                  <span>
                    {order.leadId?.totalCost
                      ? `$${order.leadId.totalCost.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Amount
                  </strong>
                  <span>
                    {order.amount ? `$${order.amount.toFixed(2)}` : "N/A"}
                  </span>
                </div>
              </div>
            </section>

            {/* Billing Information */}
            <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Billing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Billing Address
                  </strong>
                  <span>{order.billingAddress || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    City
                  </strong>
                  <span>{order.city || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    State
                  </strong>
                  <span>
                    {order.state ? order.state.toUpperCase() : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Zip
                  </strong>
                  <span>{order.zip || "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Shipping Information */}
            <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Shipping Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Address
                  </strong>
                  <span>{order.shippingAddress || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping City
                  </strong>
                  <span>{order.shippingCity || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping State
                  </strong>
                  <span>
                    {order.shippingState
                      ? order.shippingState.toUpperCase()
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Shipping Zip
                  </strong>
                  <span>{order.shippingZip || "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Order Information */}
            <section>
              <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-gray-200">
                Order Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Order ID
                  </strong>
                  <span>{order._id || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Order Status
                  </strong>
                  <span>{order.status || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Lead Status
                  </strong>
                  <span>{order.leadId?.status || "N/A"}</span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Sales Person
                  </strong>
                  <span>
                    {order.salesPerson?.name ||
                      order.salesPerson?._id ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Order Created At
                  </strong>
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Lead Created At
                  </strong>
                  <span>
                    {order.leadId?.createdAt
                      ? new Date(order.leadId.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <p className="text-gray-900 dark:text-gray-100 text-center">
          No order details available
        </p>
      )}
    </div>
  );
};

export default OrderDetails;