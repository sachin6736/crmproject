import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { debounce } from "lodash";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmationModal from "./ConfirmationModal";
import { exportToExcel } from "./utilities/exportToExcel";

const LeadTableHeader = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editingAssignedId, setEditingAssignedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const assignedDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingSalesPersons, setLoadingSalesPersons] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmText, setConfirmText] = useState("Confirm");
  const [secondaryConfirmText, setSecondaryConfirmText] = useState("");
  const [secondaryConfirmAction, setSecondaryConfirmAction] = useState(null);
  const [confirmOverrideClass, setConfirmOverrideClass] = useState("");
  const [secondaryOverrideClass, setSecondaryOverrideClass] = useState("");

  const statusTextColors = {
    Quoted: "text-yellow-600 dark:text-yellow-400",
    "No Response": "text-gray-500 dark:text-gray-400",
    "Wrong Number": "text-red-500 dark:text-red-400",
    "Not Interested": "text-red-500 dark:text-red-400",
    "Price too high": "text-orange-500 dark:text-orange-400",
    "Part not available": "text-purple-600 dark:text-purple-400",
    Ordered: "text-green-600 dark:text-green-400",
    default: "text-gray-600 dark:text-gray-400",
  };

  // Debounced search function
  const debouncedFetchLeads = useRef(
    debounce(async (user, searchQuery, statusFilter, currentPage) => {
      setLoadingLeads(true);
      try {
        const isAdmin = user?.role === "admin";
        const endpoint = isAdmin ? "/getleads" : "/getleadbyperson";
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/Lead${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch leads");
        const data = await response.json();
        // Sort leads to show isOwnLead first for sales users
        const sortedLeads = (data.leads || []).sort((a, b) => {
          if (user?.role === "sales") {
            if (a.isOwnLead && !b.isOwnLead) return -1;
            if (!a.isOwnLead && b.isOwnLead) return 1;
          }
          return 0;
        });
        setLeads(sortedLeads);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast.error("Failed to load leads");
      } finally {
        setLoadingLeads(false);
      }
    }, 500)
  ).current;

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

  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Admin/getmyteam`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch salespersons");
        const data = await response.json();
        const salesUsers = data.filter((user) => user.role === "sales");
        setSalesPersons(salesUsers);
      } catch (error) {
        console.error("Error fetching salespersons:", error);
        toast.error("Error fetching salespersons");
      } finally {
        setLoadingSalesPersons(false);
      }
    };
    if (user?.role === "admin") {
      fetchSalesPersons();
    } else {
      setLoadingSalesPersons(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      debouncedFetchLeads(user, searchQuery, statusFilter, currentPage);
    }
    return () => debouncedFetchLeads.cancel();
  }, [user, searchQuery, statusFilter, currentPage, debouncedFetchLeads]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEditingLeadId(null);
      }
      if (
        user?.role === "admin" &&
        assignedDropdownRef.current &&
        !assignedDropdownRef.current.contains(event.target)
      ) {
        setEditingAssignedId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user?.role]);

  const showOrderedConfirmation = (leadId, newStatus) => {
    setEditingLeadId(null);
    setConfirmTitle("Confirm Status Change");
    setConfirmMessage("Status will be changed to 'Ordered'. Do you want to go to the Order Page?");
    setConfirmText("Yes, go to Order Page");
    setConfirmAction(() => () => {
      updateStatus(leadId, newStatus, true);
      setShowConfirmModal(false);
    });
    setConfirmOverrideClass("!bg-green-600 !dark:bg-green-500 !hover:bg-green-700 !dark:hover:bg-green-600 !focus:ring-green-500");
    setSecondaryConfirmText("No, just change status");
    setSecondaryConfirmAction(() => () => {
      updateStatus(leadId, newStatus, false);
      setShowConfirmModal(false);
    });
    setSecondaryOverrideClass("");
    setShowConfirmModal(true);
  };

  const showStatusConfirmation = (leadId, newStatus) => {
    setEditingLeadId(null);
    setConfirmTitle("Confirm Status Change");
    setConfirmMessage(`Are you sure you want to change the status to '${newStatus}'?`);
    setConfirmText("Change Status");
    setConfirmAction(() => () => {
      updateStatus(leadId, newStatus, false);
      setShowConfirmModal(false);
    });
    setConfirmOverrideClass("");
    setSecondaryConfirmText("");
    setSecondaryConfirmAction(null);
    setSecondaryOverrideClass("");
    setShowConfirmModal(true);
  };

  const mandates = (leadId, salesPersonId, salesPersonName) => {
    setEditingAssignedId(null);
    setConfirmTitle("Confirm Lead Reassignment");
    setConfirmMessage(`Are you sure you want to reassign this lead to ${salesPersonName}?`);
    setConfirmText("Reassign Lead");
    setConfirmAction(() => () => {
      reassignLead(leadId, salesPersonId, salesPersonName);
      setShowConfirmModal(false);
    });
    setConfirmOverrideClass("");
    setSecondaryConfirmText("");
    setSecondaryConfirmAction(null);
    setSecondaryOverrideClass("");
    setShowConfirmModal(true);
  };

  const updateStatus = async (leadId, newStatus, goToOrderPage = false) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Lead/editstatus/${leadId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Status changed");
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        setEditingLeadId(null);

        if (newStatus === "Ordered" && goToOrderPage) {
          if (leadId) {
            navigate(`/home/order/${leadId}`);
          } else {
            toast.error("Invalid lead ID");
          }
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const reassignLead = async (leadId, salesPersonId, salesPersonName) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/Lead/reassign/${leadId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ salesPersonId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId
              ? {
                  ...lead,
                  salesPerson: { _id: salesPersonId, name: salesPersonName },
                  isOwnLead: salesPersonId.toString() === user?._id?.toString(),
                }
              : lead
          )
        );
        setEditingAssignedId(null);
      } else {
        toast.error(data.message || "Failed to reassign lead");
      }
    } catch (error) {
      toast.error("Network error: Unable to reassign lead");
      console.error("Error reassigning lead:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }

    setActionLoading(true);
    const formattedLeads = leads.map((lead) => ({
      ClientName: lead.clientName || "N/A",
      PhoneNumber: lead.phoneNumber || "N/A",
      Email: lead.email || "N/A",
      PartRequested: lead.partRequested || "N/A",
      Status: lead.status || "N/A",
      Zip: lead.zip || "N/A",
      CreatedAt: lead.createdAt
        ? new Date(lead.createdAt).toLocaleString()
        : "N/A",
    }));

    try {
      await exportToExcel(formattedLeads, "leads.xlsx");
      toast.success("Leads exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting leads to Excel");
      console.error("Error exporting to Excel:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      <LoadingOverlay isLoading={loadingUser || loadingLeads || loadingSalesPersons || actionLoading} />
      <div className={`${(loadingUser || loadingLeads || loadingSalesPersons || actionLoading) ? "blur-[1px]" : ""}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-wrap justify-start space-x-2 bg-white dark:bg-gray-800 shadow-md p-2 w-full md:w-1/2 rounded-md">
            {["New"].map((btn, i) => (
              <button
                key={i}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 border-r last:border-r-0 border-gray-300 dark:border-gray-600 hover:bg-[#032d60] dark:hover:bg-gray-700 hover:text-white dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => btn === "New" && navigate("/home/userform")}
                disabled={actionLoading}
              >
                {btn}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search by Name, Email, Phone, Part Requested, or Zip..."
              className="px-3 py-2 border rounded w-60 md:w-72 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={actionLoading}
            />
            <select
              className="border px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={actionLoading}
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
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingLeads || leads.length === 0 || actionLoading}
              >
                Download as Excel
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md overflow-x-auto flex-grow relative">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {[
                  "Client Name ⬍",
                  "Phone Number ⬍",
                  "Email ⬍",
                  "Part Requested ⬍",
                  "Status ⬍",
                  ...(user?.role === "admin" ? ["Assigned ⬍"] : []),
                  "Zip ⬍",
                  "Created At ⬍",
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
              {leads.length > 0 ? (
                leads.map((lead, index) => (
                  <tr
                    key={index}
                    className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      user?.role === "sales"
                        ? lead.isOwnLead
                          ? "bg-green-100 dark:bg-green-900/20"
                          : "bg-red-100 dark:bg-red-900/20"
                        : ""
                    }`}
                  >
                    <td
                      className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] dark:hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                      onClick={() =>
                        !actionLoading && navigate(`/home/sales/lead/${lead._id}`)
                      }
                    >
                      {lead.clientName || "N/A"}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {lead.phoneNumber || "N/A"}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {lead.email || "N/A"}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {lead.partRequested || "N/A"}
                    </td>
                    <td className="px-3 md:px-4 py-2 relative">
                      <span
                        className={`cursor-pointer font-semibold ${
                          statusTextColors[lead.status] ||
                          statusTextColors.default
                        }`}
                        onClick={() => !actionLoading && setEditingLeadId(lead._id)}
                      >
                        {lead.status || "Unknown"}
                      </span>
                      {editingLeadId === lead._id && (
                        <div
                          ref={dropdownRef}
                          className="absolute left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md w-40 border border-gray-200 dark:border-gray-700 z-10"
                        >
                          {Object.keys(statusTextColors)
                            .filter((key) => key !== "default")
                            .map((status) => (
                              <div
                                key={status}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                  statusTextColors[status]
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!actionLoading) {
                                    status === "Ordered"
                                      ? showOrderedConfirmation(lead._id, status)
                                      : showStatusConfirmation(lead._id, status);
                                  }
                                }}
                              >
                                {status}
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-3 md:px-4 py-2 relative">
                        <span
                          className="cursor-pointer text-gray-900 dark:text-gray-100"
                          onClick={() => !actionLoading && setEditingAssignedId(lead._id)}
                        >
                          {lead.salesPerson?.name || "Unassigned"}
                        </span>
                        {editingAssignedId === lead._id && (
                          <div
                            ref={assignedDropdownRef}
                            className="absolute left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md w-40 border border-gray-200 dark:border-gray-700 z-10"
                          >
                            {salesPersons.map((salesPerson) => (
                              <div
                                key={salesPerson._id}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                onClick={() =>
                                  !actionLoading &&
                                  showReassignConfirmation(
                                    lead._id,
                                    salesPerson._id,
                                    salesPerson.name
                                  )
                                }
                              >
                                {salesPerson.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {lead.zip || "N/A"}
                    </td>
                    <td className="px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={user?.role === "admin" ? 8 : 7}
                    className="text-center py-4 text-gray-900 dark:text-gray-100"
                  >
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 space-x-2 bg-[#cbd5e1] dark:bg-gray-800 z-20 relative">
            <button
              onClick={() => !actionLoading && setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1 || actionLoading}
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => !actionLoading && setCurrentPage(index + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === index + 1
                    ? "bg-blue-500 dark:bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                } hover:bg-blue-100 dark:hover:bg-blue-500 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={actionLoading}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                !actionLoading && setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="px-3 py-1 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages || actionLoading}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText="Cancel"
        secondaryText={secondaryConfirmText}
        secondaryOnClick={secondaryConfirmAction}
        confirmButtonProps={{
          disabled: actionLoading,
          className: `${confirmOverrideClass} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`,
        }}
        cancelButtonProps={{
          disabled: actionLoading,
          className: `${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`,
        }}
        secondaryButtonProps={{
          disabled: actionLoading,
          className: `${secondaryOverrideClass} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`,
        }}
      />
    </div>
  );
};

export default LeadTableHeader;