
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";

const OrdersHistory = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const itemsPerPage = 10;

  const statusTextColors = {
    Delivered: "text-green-600 dark:text-green-400",
    Shipped: "text-blue-600 dark:text-blue-400",
    Pending: "text-yellow-600 dark:text-yellow-400",
    default: "text-gray-600 dark:text-gray-400",
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/Auth/check", {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user info:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const isAdmin = user?.role === "admin";
        const endpoint = isAdmin ? "/getallorders" : "/getmyorders";
        const response = await fetch(
          `http://localhost:3000/Order${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&status=${statusFilter}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data.orders || data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoadingOrders(false);
      }
    };
    if (user) fetchOrders();
  }, [user?.role, searchQuery, statusFilter, currentPage]);

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast.error("No orders available to export");
      return;
    }

    const formattedOrders = orders.map((order) => ({
      OrderID: order._id || "N/A",
      ClientName: order.clientName || "N/A",
      Date: order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : "N/A",
      PartRequested: order.leadId?.partRequested || "N/A",
      TotalCost: order.leadId?.totalCost
        ? `$${order.leadId.totalCost}`
        : "N/A",
      Status: order.status || "N/A",
    }));

    try {
      exportToExcel(formattedOrders, "orders.xlsx");
      toast.success("Orders exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting orders to Excel");
      console.error("Error exporting to Excel:", error);
    }
  };

  const handleOrderClick = async (orderId) => {
    setLoadingOrder(true);
    setIsModalOpen(true);
    try {
      const response = await fetch(`http://localhost:3000/Order/orderbyid/${orderId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch order data");
      }
      const data = await response.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error("Error fetching order data:", error);
      toast.error("Failed to load order details");
      setIsModalOpen(false);
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {loadingUser || loadingOrders ? (
        <div className="flex justify-center items-center py-8">
          <FullPageLoader
            size="w-10 h-10"
            color="text-blue-500 dark:text-blue-400"
            fill="fill-blue-300 dark:fill-blue-600"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-1/2 rounded-md">
              {["New"].map((btn, i) => (
                <button
                  key={i}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 border-r last:border-r-0 border-gray-300 dark:border-gray-600 hover:bg-[#032d60] dark:hover:bg-gray-700 hover:text-white dark:hover:text-gray-100"
                  onClick={() => btn === "New" && navigate("/home/userform")}
                >
                  {btn}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by Client Name, Order ID..."
                className="px-3 py-2 border rounded w-60 md:w-72 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="border px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {Object.keys(statusTextColors)
                  .filter((key) => key !== "default")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
              {user?.role === "admin" && (
                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                  disabled={loadingOrders || orders.length === 0}
                >
                  Download as Excel
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto h-[720px] flex-grow relative">
            {loadingOrders ? (
              <div className="flex justify-center items-center py-8">
                <FullPageLoader
                  size="w-10 h-10"
                  color="text-blue-500 dark:text-blue-400"
                  fill="fill-blue-300 dark:fill-blue-600"
                />
              </div>
            ) : (
              <table className="w-full text-left text-sm md:text-base">
                <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    {[
                      "Order ID ⬍",
                      "Client Name ⬍",
                      "Date ⬍",
                      "Part Requested ⬍",
                      "Total Cost ⬍",
                      "Status ⬍",
                    ].map((header, i) => (
                      <th
                        key={i}
                        className="px-3 md:px-4 py-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order, index) => (
                      <tr
                        key={index}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <td
                          className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] dark:hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                          onClick={() => handleOrderClick(order._id)}
                        >
                          {order._id || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.clientName || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.leadId?.partRequested || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.leadId?.totalCost
                            ? `$${order.leadId.totalCost}`
                            : "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2">
                          <span
                            className={`font-semibold ${
                              statusTextColors[order.status] ||
                              statusTextColors.default
                            }`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-4 text-gray-900 dark:text-gray-100"
                      >
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-2 bg-[#cbd5e1] dark:bg-gray-800 z-20 relative">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500"
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === index + 1
                      ? "bg-blue-500 dark:bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  } hover:bg-blue-100 dark:hover:bg-blue-500 border-gray-300 dark:border-gray-600`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-3 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}

          {/* Modal for Order Details */}
          {isModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all">
                <div className="flex justify-between items-center mb-6">
                  <h2
                    id="modal-title"
                    className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100"
                  >
                    Order Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {loadingOrder ? (
                  <div className="flex justify-center items-center py-8">
                    <FullPageLoader
                      size="w-8 h-8"
                      color="text-blue-500 dark:text-blue-400"
                      fill="fill-blue-300 dark:fill-blue-600"
                    />
                  </div>
                ) : selectedOrder ? (
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
                          <span>{selectedOrder.clientName || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Phone
                          </strong>
                          <span>{selectedOrder.phone || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Email
                          </strong>
                          <span>{selectedOrder.email || "N/A"}</span>
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
                          <span>{selectedOrder.make || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Model
                          </strong>
                          <span>{selectedOrder.model || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Year
                          </strong>
                          <span>{selectedOrder.year || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Trim
                          </strong>
                          <span>{selectedOrder.leadId?.trim || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Part Requested
                          </strong>
                          <span>{selectedOrder.leadId?.partRequested || "N/A"}</span>
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
                          <span>{selectedOrder.cardLastFour || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Card Expiry
                          </strong>
                          <span>
                            {selectedOrder.cardMonth && selectedOrder.cardYear
                              ? `${selectedOrder.cardMonth}/${selectedOrder.cardYear}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Part Cost
                          </strong>
                          <span>
                            {selectedOrder.leadId?.partCost
                              ? `$${selectedOrder.leadId.partCost.toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Shipping Cost
                          </strong>
                          <span>
                            {selectedOrder.leadId?.shippingCost
                              ? `$${selectedOrder.leadId.shippingCost.toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Gross Profit
                          </strong>
                          <span>
                            {selectedOrder.leadId?.grossProfit
                              ? `$${selectedOrder.leadId.grossProfit.toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Total Cost
                          </strong>
                          <span>
                            {selectedOrder.leadId?.totalCost
                              ? `$${selectedOrder.leadId.totalCost.toFixed(2)}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Amount
                          </strong>
                          <span>
                            {selectedOrder.amount
                              ? `$${selectedOrder.amount.toFixed(2)}`
                              : "N/A"}
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
                          <span>{selectedOrder.billingAddress || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            City
                          </strong>
                          <span>{selectedOrder.city || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            State
                          </strong>
                          <span>
                            {selectedOrder.state
                              ? selectedOrder.state.toUpperCase()
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Zip
                          </strong>
                          <span>{selectedOrder.zip || "N/A"}</span>
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
                          <span>{selectedOrder.shippingAddress || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Shipping City
                          </strong>
                          <span>{selectedOrder.shippingCity || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Shipping State
                          </strong>
                          <span>
                            {selectedOrder.shippingState
                              ? selectedOrder.shippingState.toUpperCase()
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Shipping Zip
                          </strong>
                          <span>{selectedOrder.shippingZip || "N/A"}</span>
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
                          <span>{selectedOrder._id || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Order Status
                          </strong>
                          <span>{selectedOrder.status || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Lead Status
                          </strong>
                          <span>{selectedOrder.leadId?.status || "N/A"}</span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Sales Person
                          </strong>
                          <span>
                            {selectedOrder.salesPerson?.name ||
                              selectedOrder.salesPerson?._id ||
                              "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Order Created At
                          </strong>
                          <span>
                            {selectedOrder.createdAt
                              ? new Date(selectedOrder.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Lead Created At
                          </strong>
                          <span>
                            {selectedOrder.leadId?.createdAt
                              ? new Date(selectedOrder.leadId.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100 text-center">
                    No order details available
                  </p>
                )}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersHistory;
