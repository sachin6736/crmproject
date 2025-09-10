import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";
import LoadingOverlay from "./LoadingOverlay";

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
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const itemsPerPage = 10;

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

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 500),
    []
  );

  // Close status filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const statusHeaderRef = document.getElementById("status-header");
      if (statusHeaderRef && !statusHeaderRef.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/check`, {
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

  // Debounced fetch orders function
  const fetchOrders = useCallback(
    debounce(async (user, searchQuery, statusFilter, currentPage) => {
      setLoadingOrders(true);
      try {
        let endpoint;
        if (user?.role === "admin") {
          endpoint = "/getallorders";
        } else if (user?.role === "sales") {
          endpoint = "/getmyorders";
        } else if (user?.role === "customer_relations") {
          endpoint = "/getcustomerorders";
        } else if (user?.role === "procurement") {
          endpoint = "/getprocurementorders";
        } else {
          throw new Error("Unauthorized role");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/Order${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
            searchQuery
          )}&status=${encodeURIComponent(statusFilter)}`,
          { credentials: "include" }
        );
        if (!response.ok)
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        const data = await response.json();
        // Sort orders to show isOwnOrder first
        const sortedOrders = (data.orders || []).sort((a, b) => {
          if (a.isOwnOrder && !b.isOwnOrder) return -1;
          if (!a.isOwnOrder && b.isOwnOrder) return 1;
          return 0;
        });
        setOrders(sortedOrders);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoadingOrders(false);
      }
    }, 500),
    []
  );

  // Trigger fetchOrders when dependencies change
  useEffect(() => {
    if (user) {
      fetchOrders(user, searchQuery, statusFilter, currentPage);
    }
    return () => fetchOrders.cancel();
  }, [user, searchQuery, statusFilter, currentPage, fetchOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleExportToExcel = async () => {
    if (orders.length === 0) {
      toast.error("No orders available to export");
      return;
    }

    setActionLoading(true);
    const formattedOrders = orders.map((order) => ({
      OrderID: order.order_id || "N/A",
      ClientName: order.clientName || "N/A",
      Phone: order.phone || "N/A",
      Email: order.email || "N/A",
      Date: order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : "N/A",
      PartRequested: order.leadId?.partRequested || "N/A",
      TotalCost: order.leadId?.totalCost ? `$${order.leadId.totalCost}` : "N/A",
      Status: order.status || "N/A",
      ...(user?.role === "admin" && {
        AssignedCustomerRelation: order.customerRelationsPerson?.name || "N/A",
        AssignedProcurement: order.procurementPerson?.name || "N/A",
      }),
    }));

    try {
      await exportToExcel(formattedOrders, "orders.xlsx");
      toast.success("Orders exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting orders to Excel");
      console.error("Error exporting to Excel:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/home/order/details/${orderId}`);
  };

  const handleStatusSelect = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingOrders || actionLoading} />
      <div className={`${loadingUser || loadingOrders || actionLoading ? "blur-[1px]" : ""}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Client Name, Order ID, Phone, Email, or Part..."
              className="px-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 transition-all duration-200"
              onChange={handleSearchChange}
              disabled={actionLoading}
            />
            <div className="relative w-full sm:w-auto">
              <select
                className="w-full sm:w-48 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={actionLoading}
              >
                <option value="">All Statuses</option>
                {[
                  "Locate Pending",
                  "PO Pending",
                  "PO Sent",
                  "PO Confirmed",
                  "Vendor Payment Pending",
                  "Vendor Payment Confirmed",
                  "Shipping Pending",
                  "Ship Out",
                  "Intransit",
                  "Delivered",
                  "Replacement",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={handleExportToExcel}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-sm font-medium"
                disabled={loadingOrders || orders.length === 0 || actionLoading}
              >
                Download as Excel
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-x-auto flex-grow relative">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                {[
                  "Order ID",
                  "Client Name",
                  "Phone",
                  "Email",
                  "Date",
                  "Part Requested",
                  "Total Cost",
                  "Status",
                  ...(user?.role === "admin" ? ["Assigned Customer Relation", "Assigned Procurement"] : []),
                ].map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-sm sm:text-base"
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
                    key={order._id || index}
                    className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                      order.status === "Replacement"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : user?.role === "customer_relations" || user?.role === "procurement"
                        ? order.isOwnOrder
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-red-100 dark:bg-red-900/20"
                        : ""
                    }`}
                  >
                    <td
                      className="px-4 py-3 whitespace-nowrap text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      onClick={() => !actionLoading && handleOrderClick(order._id)}
                    >
                      {order.order_id || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.clientName || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.phone || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.leadId?.partRequested || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.leadId?.totalCost
                        ? `$${order.leadId.totalCost.toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          statusTextColors[order.status] ||
                          statusTextColors.default
                        }`}
                      >
                        {order.status || "Unknown"}
                      </span>
                    </td>
                    {user?.role === "admin" && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.customerRelationsPerson?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.procurementPerson?.name || "N/A"}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={user?.role === "admin" ? 10 : 8}
                    className="text-center py-6 text-gray-600 dark:text-gray-400"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => !actionLoading && setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 transition-all duration-200 text-sm font-medium"
              disabled={currentPage === 1 || actionLoading}
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => !actionLoading && setCurrentPage(index + 1)}
                className={`px-4 py-2 border rounded-lg ${
                  currentPage === index + 1
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                } hover:bg-blue-100 dark:hover:bg-blue-600 border-gray-300 dark:border-gray-600 transition-all duration-200 text-sm font-medium`}
                disabled={actionLoading}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                !actionLoading && setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 transition-all duration-200 text-sm font-medium"
              disabled={currentPage === totalPages || actionLoading}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersHistory;