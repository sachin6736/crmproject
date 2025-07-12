import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";

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
  const itemsPerPage = 10;

  const statusTextColors = {
    Litigation: "text-red-600 dark:text-red-400",
    default: "text-gray-600 dark:text-gray-400",
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 500),
    []
  );

  // Fetch user data
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

  // Debounced fetch litigation orders
  const fetchLitigationOrders = useCallback(
    debounce(async (user, searchQuery, currentPage) => {
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
          `http://localhost:3000/Order${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
            searchQuery
          )}&status=Litigation`,
          { credentials: "include" }
        );
        if (!response.ok)
          throw new Error(`Failed to fetch litigation orders: ${response.statusText}`);
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching litigation orders:", error);
        toast.error("Failed to load litigation orders");
      } finally {
        setLoadingOrders(false);
      }
    }, 500),
    []
  );

  // Trigger fetchLitigationOrders when dependencies change
  useEffect(() => {
    if (user) {
      fetchLitigationOrders(user, searchQuery, currentPage);
    }
    return () => fetchLitigationOrders.cancel(); // Cleanup debounce on unmount
  }, [user, searchQuery, currentPage, fetchLitigationOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast.error("No litigation orders available to export");
      return;
    }

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
      Status: order.status || "Litigation",
    }));

    try {
      exportToExcel(formattedOrders, "litigation_orders.xlsx");
      toast.success("Litigation orders exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting litigation orders to Excel");
      console.error("Error exporting to Excel:", error);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/home/order/details/${orderId}`);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {loadingUser || loadingOrders ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search Litigation Orders by Client Name, Order ID, Phone, Email, or Part..."
                className="px-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 transition-all duration-200"
                onChange={handleSearchChange}
              />
              {user?.role === "admin" && (
                <button
                  onClick={handleExportToExcel}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all duration-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-sm font-medium"
                  disabled={loadingOrders || orders.length === 0}
                >
                  Download as Excel
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-x-auto flex-grow">
            {loadingOrders ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : (
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
                        className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                          order.isOwnOrder && user?.role === "customer_relations"
                            ? "bg-red-50 dark:bg-red-900/20"
                            : ""
                        }`}
                      >
                        <td
                          className="px-4 py-3 whitespace-nowrap text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          onClick={() => handleOrderClick(order._id)}
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
                            {order.status || "Litigation"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-6 text-gray-600 dark:text-gray-400"
                      >
                        No litigation orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 transition-all duration-200 text-sm font-medium"
              disabled={currentPage === 1}
              >
              Prev
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 border rounded-lg ${
                    currentPage === index + 1
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  } hover:bg-blue-100 dark:hover:bg-blue-600 border-gray-300 dark:border-gray-600 transition-all duration-200 text-sm font-medium`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 transition-all duration-200 text-sm font-medium"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LitigationOrders;