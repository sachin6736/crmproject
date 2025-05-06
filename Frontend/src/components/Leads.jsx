import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from "./utilities/FullPageLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportToExcel } from "./utilities/exportToExcel";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const LeadTableHeader = () => {
  const navigate = useNavigate();
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

  const statusTextColors = {
    Quoted: "text-yellow-600",
    "No Response": "text-gray-500",
    "Wrong Number": "text-red-500",
    "Not Interested": "text-red-500",
    "Price too high": "text-orange-500",
    "Part not available": "text-purple-600",
    Ordered: "text-green-600",
    default: "text-gray-600",
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
    const fetchSalesPersons = async () => {
      try {
        const response = await fetch("http://localhost:3000/Admin/getmyteam", {
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
    const fetchLeads = async () => {
      setLoadingLeads(true);
      try {
        const isAdmin = user?.role === "admin";
        const endpoint = isAdmin ? "/getleads" : "/getleadbyperson";
        const response = await fetch(
          `http://localhost:3000/Lead${endpoint}?page=${currentPage}&limit=10&search=${searchQuery}&status=${statusFilter}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch leads");
        const data = await response.json();
        setLeads(data.leads);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast.error("Failed to load leads");
      } finally {
        setLoadingLeads(false);
      }
    };
    if (user) fetchLeads();
  }, [user?.role, searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEditingLeadId(null);
      }
      if (
        assignedDropdownRef.current &&
        !assignedDropdownRef.current.contains(event.target)
      ) {
        setEditingAssignedId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showConfirmationModal = (leadId, newStatus) => {
    confirmAlert({
      title: "Confirm Status Change",
      message:
        "Status will be changed to 'Ordered'. Do you want to go to the Order Page?",
      buttons: [
        {
          label: "Yes, go to Order Page",
          onClick: () => updateStatus(leadId, newStatus, true),
          className:
            "text-white bg-green-600 px-4 py-2 rounded hover:bg-green-700",
        },
        {
          label: "No, just change status",
          onClick: () => updateStatus(leadId, newStatus, false),
          className:
            "text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700",
        },
      ],
      closeOnClickOutside: true,
    });
  };

  const updateStatus = async (leadId, newStatus, goToOrderPage = false) => {
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/editstatus/${leadId}`,
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
    }
  };

  const reassignLead = async (leadId, salesPersonId, salesPersonName) => {
    try {
      const response = await fetch(
        `http://localhost:3000/Lead/reassign/${leadId}`,
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
    }
  };

  const handleExportToExcel = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }

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
      exportToExcel(formattedLeads, "leads.xlsx");
      toast.success("Leads exported to Excel successfully");
    } catch (error) {
      toast.error("Error exporting leads to Excel");
      console.error("Error exporting to Excel:", error);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col">
      {loadingUser || loadingLeads || loadingSalesPersons ? (
        <div className="flex justify-center items-center py-8">
          <FullPageLoader />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap justify-start space-x-2 bg-white shadow-md p-2 w-full md:w-1/2 rounded-md">
              {["New", "Import", "Calendar"].map((btn, i) => (
                <button
                  key={i}
                  className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300 hover:bg-[#032d60] hover:text-white"
                  onClick={() => btn === "New" && navigate("/home/userform")}
                >
                  {btn}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search by Name, Email, Phone..."
                className="px-3 py-2 border rounded w-60 md:w-72 focus:outline-none focus:ring focus:border-blue-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="border px-3 py-2 rounded-md"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={loadingLeads || leads.length === 0}
                >
                  Download as Excel
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 bg-white rounded-md shadow-md overflow-x-auto flex-grow relative">
            {loadingLeads ? (
              <div className="flex justify-center items-center py-8">
                <FullPageLoader />
              </div>
            ) : (
              <table className="w-full text-left text-sm md:text-base">
                <thead className="bg-gray-200 text-gray-600">
                  <tr>
                    {[
                      "Client Name ⬍",
                      "Phone Number ⬍",
                      "Email ⬍",
                      "Part Requested ⬍",
                      "Status ⬍",
                      "Assigned ⬍",
                      "Zip ⬍",
                      "Created At ⬍",
                    ].map((header, i) => (
                      <th
                        key={i}
                        className="px-3 md:px-4 py-2 border-b whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.length > 0 ? (
                    leads.map((lead, index) => (
                      <tr key={index} className="border-t hover:bg-gray-100">
                        <td
                          className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] cursor-pointer whitespace-nowrap"
                          onClick={() =>
                            navigate(`/home/sales/lead/${lead._id}`)
                          }
                        >
                          {lead.clientName || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.phoneNumber || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.email || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.partRequested || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 relative">
                          <span
                            className={`cursor-pointer font-semibold ${
                              statusTextColors[lead.status] ||
                              statusTextColors.default
                            }`}
                            onClick={() => setEditingLeadId(lead._id)}
                          >
                            {lead.status || "Unknown"}
                          </span>
                          {editingLeadId === lead._id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 md:left-0 mt-1 bg-white shadow-lg rounded-md w-40 border z-10"
                            >
                              {Object.keys(statusTextColors)
                                .filter((key) => key !== "default")
                                .map((status) => (
                                  <div
                                    key={status}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 ${statusTextColors[status]}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      status === "Ordered"
                                        ? showConfirmationModal(
                                            lead._id,
                                            status
                                          )
                                        : updateStatus(lead._id, status);
                                    }}
                                  >
                                    {status}
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-2 relative">
                          <span
                            className="cursor-pointer"
                            onClick={() => setEditingAssignedId(lead._id)}
                          >
                            {lead.salesPerson?.name || "Unassigned"}
                          </span>
                          {editingAssignedId === lead._id && (
                            <div
                              ref={assignedDropdownRef}
                              className="absolute right-0 md:left-0 mt-1 bg-white shadow-lg rounded-md w-40 border z-10"
                            >
                              {salesPersons.map((salesPerson) => (
                                <div
                                  key={salesPerson._id}
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200"
                                  onClick={() =>
                                    reassignLead(
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
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.zip || "N/A"}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No leads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-2 bg-[#cbd5e1] z-20 relative">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
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
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  } hover:bg-blue-100`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
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

export default LeadTableHeader;
