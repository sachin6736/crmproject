import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOrderStatusDropdown, setShowOrderStatusDropdown] = useState(null); // Track dropdown for each order
  const itemsPerPage = 10;
  const statusHeaderRef = useRef(null);
  const orderStatusRefs = useRef({}); // Refs for each order's status dropdown

  const statusTextColors = {
    "Locate Pending": "text-yellow-500 dark:text-yellow-300",
    "PO Pending": "text-orange-500 dark:text-orange-300",
    "PO Confirmed": "text-blue-500 dark:text-blue-300",
    "Vendor Payment Pending": "text-red-500 dark:text-red-300",
    "Vendor Payment Confirmed": "text-green-500 dark:text-green-300",
    "Shipping Pending": "text-purple-500 dark:text-purple-300",
    "Ship Out": "text-indigo-500 dark:text-indigo-300",
    Instransit: "text-teal-500 dark:text-teal-300",
    Delivered: "text-green-600 dark:text-green-400",
    Replacement: "text-pink-500 dark:text-pink-300",
    default: "text-gray-600 dark:text-gray-400",
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      console.log("Debounced search triggered with value:", value);
      setSearchQuery(value);
    }, 500),
    []
  );

  // Close header status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusHeaderRef.current &&
        !statusHeaderRef.current.contains(event.target)
      ) {
        console.log("Clicked outside, closing header dropdown");
        setShowStatusDropdown(false);
      }
      // Close order status dropdowns
      if (
        showOrderStatusDropdown &&
        !Object.values(orderStatusRefs.current).some((ref) =>
          ref?.contains(event.target)
        )
      ) {
        console.log("Clicked outside, closing order status dropdown");
        setShowOrderStatusDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOrderStatusDropdown]);

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

        console.log("Fetching orders with params:", {
          endpoint,
          currentPage,
          itemsPerPage,
          searchQuery,
          statusFilter,
        });

        const response = await fetch(
          `http://localhost:3000/Order${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
            searchQuery
          )}&status=${encodeURIComponent(statusFilter)}`,
          { credentials: "include" }
        );
        if (!response.ok)
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        const data = await response.json();
        setOrders(data.orders || []);
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
    return () => fetchOrders.cancel(); // Cleanup debounce on unmount
  }, [user, searchQuery, statusFilter, currentPage, fetchOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast.error("No orders available to export");
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

  const handleOrderClick = (orderId) => {
    navigate(`/home/order/details/${orderId}`);
  };

  const handleStatusSelect = (status) => {
    console.log("Selected status:", status);
    setStatusFilter(status);
    setShowStatusDropdown(false);
  };

  const handleOrderStatusSelect = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/Order/update-status/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to update order status");
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setShowOrderStatusDropdown(null);
    }
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
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by Client Name, Order ID, Phone, Email, or Part Requested..."
                className="px-3 py-2 border rounded w-60 md:w-72 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
                onChange={handleSearchChange}
              />
              <select
                className="border px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
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
                      "Phone ⬍",
                      "Email ⬍",
                      "Date ⬍",
                      "Part Requested ⬍",
                      "Total Cost ⬍",
                    ].map((header, i) => (
                      <th
                        key={i}
                        className="px-3 md:px-4 py-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                    <th
                      ref={statusHeaderRef}
                      className="px-3 md:px-4 py-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap relative cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Toggling status dropdown");
                        setShowStatusDropdown(!showStatusDropdown);
                      }}
                    >
                      Status ⬍
                      {showStatusDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-30">
                          <div
                            className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                              statusFilter === ""
                                ? "bg-blue-100 dark:bg-blue-600"
                                : ""
                            }`}
                            onClick={() => handleStatusSelect("")}
                          >
                            All
                          </div>
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
                            <div
                              key={status}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                                statusFilter === status
                                  ? "bg-blue-100 dark:bg-blue-600"
                                  : ""
                              }`}
                              onClick={() => handleStatusSelect(status)}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order, index) => (
                      <tr
                        key={order._id || index}
                        className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          order.isOwnOrder &&
                          user?.role === "customer_relations"
                            ? "bg-red-100 dark:bg-red-900"
                            : ""
                        }`}
                      >
                        <td
                          className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] dark:hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                          onClick={() => handleOrderClick(order._id)}
                        >
                          {order.order_id || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.clientName || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.phone || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {order.email || "N/A"}
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
                        <td
                          className="px-3 md:px-4 py-2 relative"
                          ref={(el) => (orderStatusRefs.current[order._id] = el)}
                          onClick={() =>
                            setShowOrderStatusDropdown(
                              showOrderStatusDropdown === order._id
                                ? null
                                : order._id
                            )
                          }
                        >
                          <span
                            className={`font-semibold cursor-pointer ${
                              statusTextColors[order.status] ||
                              statusTextColors.default
                            }`}
                          >
                            {order.status || "Unknown"}
                          </span>
                          {showOrderStatusDropdown === order._id && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-30">
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
                                <div
                                  key={status}
                                  className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                                    order.status === status
                                      ? "bg-blue-100 dark:bg-blue-600"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderStatusSelect(order._id, status);
                                  }}
                                >
                                  {status}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
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
        </>
      )}
    </div>
  );
};

export default OrdersHistory;