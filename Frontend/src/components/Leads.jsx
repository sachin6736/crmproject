
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FullPageLoader from './utilities/FullPageLoader';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportToExcel } from './utilities/exportToExcel'; // Assuming exportToExcel is in a separate file

const LeadTableHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/Auth/check", {
          credentials: "include",
        });
        const data = await response.json();
        console.log("data", data);
        setUser(data.user);
        setLoadingUser(false);
      } catch (error) {
        console.error("Error fetching user info:", error);
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const isAdmin = user?.role === "admin";
        const endpoint = isAdmin ? "/getleads" : "/getleadbyperson";
        console.log("endpoint", endpoint);
        const response = await fetch(
          `http://localhost:3000/Lead${endpoint}?page=${currentPage}&limit=10&search=${searchQuery}&status=${statusFilter}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        setLeads(data.leads);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage || 1);
        setLoadingLeads(false);
      } catch (error) {
        console.error("Error fetching my leads:", error);
        setLoadingLeads(false);
      }
    };
    if (user) {
      fetchLeads();
    }
  }, [user, searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEditingLeadId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateStatus = async (leadId, newStatus) => {
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
      } else {
        toast.error("Failed to update status");
        console.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating lead status:", error);
      console.error("Error updating lead status:", error);
    }
  };

  const handleExportToExcel = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }

    // Format leads data for Excel
    const formattedLeads = leads.map((lead) => ({
      ClientName: lead.clientName,
      PhoneNumber: lead.phoneNumber,
      Email: lead.email,
      PartRequested: lead.partRequested,
      Status: lead.status,
      Zip: lead.zip,
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

  const statusTextColors = {
    Quoted: "text-yellow-600",
    "No Response": "text-gray-500",
    "Wrong Number": "text-red-500",
    "Not Interested": "text-red-500",
    "Price too high": "text-orange-500",
    "Part not available": "text-purple-600",
    Ordered: "text-green-600",
  };

  const filteredLeads = leads.filter(
    (lead) =>
      [lead.clientName, lead.email, lead.phoneNumber].some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase())
      ) && (statusFilter === "" || lead.status === statusFilter)
  );

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col">
      {loadingUser ? (
        <div className="flex justify-center items-center py-8">
          <FullPageLoader />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap justify-start space-x-2 bg-white shadow-md p-2 w-full md:w-1/2 rounded-md">
              {["New", "Import", "Contacts", "Calendar", "Testing"].map(
                (button, index) => (
                  <button
                    key={index}
                    className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300 hover:bg-[#032d60] hover:text-white"
                    onClick={() => button === "New" && navigate("/home/userform")}
                  >
                    {button}
                  </button>
                )
              )}
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
                {Object.keys(statusTextColors).map((status) => (
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

          <div className="mt-4 bg-white rounded-md shadow-md overflow-hidden overflow-x-auto flex-grow">
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
                      "Zip ⬍",
                      "Created At ⬍",
                    ].map((header, index) => (
                      <th
                        key={index}
                        className="px-3 md:px-4 py-2 border-b whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead, index) => (
                      <tr key={index} className="border-t hover:bg-gray-100">
                        <td
                          className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] cursor-pointer whitespace-nowrap"
                          onClick={() => navigate(`/home/sales/lead/${lead._id}`)}
                        >
                          {lead.clientName}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.phoneNumber}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.email}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.partRequested}
                        </td>
                        <td className="px-3 md:px-4 py-2 relative">
                          <span
                            className={`cursor-pointer font-semibold ${statusTextColors[lead.status]}`}
                            onClick={() => setEditingLeadId(lead._id)}
                          >
                            {lead.status}
                          </span>
                          {editingLeadId === lead._id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 md:left-0 mt-1 bg-white shadow-lg rounded-md w-40 border z-10"
                            >
                              {Object.keys(statusTextColors).map((status) => (
                                <div
                                  key={status}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 ${statusTextColors[status]}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(lead._id, status);
                                  }}
                                >
                                  {status}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                          {lead.zip}
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
                      <td className="px-4 py-2 text-center" colSpan={7}>
                        No data available
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
