import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { debounce } from "lodash";
import LoadingOverlay from "./LoadingOverlay";
import { exportToExcel } from "./utilities/exportToExcel";

const ReplacementOrders = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [replacements, setReplacements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingReplacements, setLoadingReplacements] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounced fetch for replacements
  const debouncedFetchReplacements = useRef(
    debounce(async (searchQuery, currentPage) => {
      setLoadingReplacements(true);
      try {
        const url = `${import.meta.env.VITE_API_URL}/Replacement/replacements?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`;
        
        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to fetch replacement orders");
        }

        const data = await response.json();
        setReplacements(data.replacements || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching replacements:", error);
        toast.error(error.message || "Failed to load replacement orders");
      } finally {
        setLoadingReplacements(false);
      }
    }, 500)
  ).current;

  // Fetch authenticated user
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
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Trigger fetch when user, search, or page changes
  useEffect(() => {
    if (user) {
      debouncedFetchReplacements(searchQuery, currentPage);
    }

    return () => debouncedFetchReplacements.cancel();
  }, [user, searchQuery, currentPage, debouncedFetchReplacements]);

  // Export to Excel
  const handleExportToExcel = async () => {
    if (replacements.length === 0) {
      toast.error("No replacement orders to export");
      return;
    }

    setActionLoading(true);

    const formatted = replacements.map((rep) => ({
      "Tracking ID": rep.replacementId || "N/A",
      "Original Order": rep.originalOrderNumber || "N/A",
      "Customer Name": rep.customerName || "N/A",
      "Phone": rep.customerPhone || "N/A",
      "Email": rep.customerEmail || "N/A",
      "Part Requested": rep.partRequested || "N/A",
      "Make": rep.make || "N/A",
      "Model": rep.model || "N/A",
      "Year": rep.year || "N/A",
      "Created At": rep.createdAt ? new Date(rep.createdAt).toLocaleString() : "N/A",
      "Created By": rep.createdBy || "System",
    }));

    try {
      await exportToExcel(formatted, "replacement_orders.xlsx");
      toast.success("Replacement orders exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting to Excel");
    } finally {
      setActionLoading(false);
    }
  };

  const isViewer = user?.role === "viewer";

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingReplacements || actionLoading} />

      <div className={`${loadingUser || loadingReplacements || actionLoading ? "blur-[1px]" : ""}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Replacement Orders</h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, phone, email, part, or tracking ID..."
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 w-full sm:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={actionLoading}
            />

            {/* Export Button */}
            {!isViewer && (
              <button
                onClick={handleExportToExcel}
                disabled={loadingReplacements || replacements.length === 0 || actionLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                Download as Excel
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {[
                    "Tracking ID",
                    "Original Order",
                    "Customer Name",
                    "Phone",
                    "Email",
                    "Part Requested",
                    "Vehicle",
                    "Created At",
                    "Created By",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {replacements.length > 0 ? (
                  replacements.map((rep) => (
                    <tr
                      key={rep._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/home/replacements/${rep._id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline focus:outline-none"
                        >
                          {rep.replacementId || "N/A"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.originalOrderNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.customerName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.customerPhone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.customerEmail || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.partRequested || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {`${rep.make || "N/A"} / ${rep.model || "N/A"} / ${rep.year || "N/A"}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {rep.createdBy || "System"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 text-lg"
                    >
                      {loadingReplacements ? "Loading replacement orders..." : "No replacement orders found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-3">
            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || actionLoading}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => !actionLoading && setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={actionLoading}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => !actionLoading && setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || actionLoading}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplacementOrders;