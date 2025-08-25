import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";
import LoadingOverlay from "./LoadingOverlay";

const LitigationOrders = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Added for async actions
  const itemsPerPage = 10;

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 500),
    []
  );

  // Status color mapping
  const statusTextColors = {
    Litigation: "text-green-600 dark:text-green-400",
    Replacement: "text-orange-600 dark:text-orange-400",
    "Replacement Cancelled": "text-red-600 dark:text-red-400",
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
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
    debounce(async (user, searchQuery, currentPage) => {
      setLoadingOrders(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/LiteReplace/getLitigation?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
            searchQuery
          )}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch orders: ${response.statusText}`);
        }
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching litigation orders:", error);
        toast.error(error.message || "Failed to load orders");
      } finally {
        setLoadingOrders(false);
      }
    }, 500),
    []
  );

  // Trigger fetchOrders when dependencies change
  useEffect(() => {
    if (user) {
      fetchOrders(user, searchQuery, currentPage);
    }
    return () => fetchOrders.cancel(); // Cleanup debounce on unmount
  }, [user, searchQuery, currentPage, fetchOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleExportToExcel = async () => {
    if (orders.length === 0) {
      toast.error("No orders available to export");
      return;
    }

    setActionLoading(true); // Set loading for export
    const formattedOrders = orders.map((order) => ({
      OrderID: order.order_id || "N/A",
      ClientName: order.clientName || "N/A",
      Phone: order.phone || "N/A",
      Email: order.email || "N/A",
      Date: order.date ? new Date(order.date).toLocaleString() : "N/A",
      PartRequested: order.partRequested || "N/A",
      TotalCost: order.totalCost ? `$${order.totalCost.toFixed(2)}` : "N/A",
      Status: order.status || "N/A",
    }));

    try {
      await exportToExcel(formattedOrders, "litigation_orders.xlsx");
      toast.success("Orders exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting orders to Excel");
      console.error("Error exporting to Excel:", error);
    } finally {
      setActionLoading(false); // Reset loading
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/home/litigation/details/${orderId}`);
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
              disabled={actionLoading} // Disable during action
            />
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
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
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
                      {order.date
                        ? new Date(order.date).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.partRequested || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {order.totalCost
                        ? `$${order.totalCost.toFixed(2)}`
                        : "N/A"}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${statusTextColors[order.status] || "text-gray-900 dark:text-gray-100"}`}>
                      {order.status || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
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

export default LitigationOrders;