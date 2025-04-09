import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LeadTableHeader = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("http://localhost:3000/Lead/getleads");
        const data = await response.json();
        setLeads(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    };
    fetchLeads();
  }, []);

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
      const response = await fetch(`http://localhost:3000/Lead/updatelead/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        setEditingLeadId(null);
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  const statusTextColors = {
    Lead: "text-blue-600",
    Contacted: "text-yellow-500",
    Nurturing: "text-purple-600",
    Qualified: "text-green-600",
    "Not Qualified": "text-red-600",
  };

  // Calculate paginated data
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = leads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 md:p-6">
      {/* Top Buttons */}
      <div className="flex flex-wrap justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-full md:w-1/2">
        {["New", "Import", "Contacts", "Calendar", "Testing"].map((button, index) => (
          <button
            key={index}
            className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300"
            onClick={() => button === "New" && navigate("/userform")}
          >
            {button}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 bg-white rounded-md shadow-md overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm md:text-base">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              {["Client Name ⬍", "Phone Number ⬍", "Email ⬍", "Part Requested ⬍", "Status ⬍", "Zip ⬍", "Created At ⬍"].map(
                (header, index) => (
                  <th key={index} className="px-3 md:px-4 py-2 border-b whitespace-nowrap">
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {currentLeads.length > 0 ? (
              currentLeads.map((lead, index) => (
                <tr key={index} className="border-t hover:bg-gray-100">
                  <td
                    className="px-3 md:px-4 py-2 hover:underline hover:bg-[#749fdf] cursor-pointer whitespace-nowrap"
                    onClick={() => navigate(`/sales/lead/${lead._id}`)}
                  >
                    {lead.clientName}
                  </td>
                  <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.phoneNumber}</td>
                  <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.email}</td>
                  <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.partRequested}</td>
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
                            onClick={() => updateStatus(lead._id, status)}
                          >
                            {status}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 md:px-4 py-2 whitespace-nowrap">{lead.zip}</td>
                  <td className="px-3 md:px-4 py-2 whitespace-nowrap">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "N/A"}
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
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
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
                currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-100"
              } hover:bg-blue-100`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadTableHeader;
