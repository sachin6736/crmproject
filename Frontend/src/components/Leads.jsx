import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LeadTableHeader = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
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

  return (
    <div className="p-6">
      {/* Buttons */}
      <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/2">
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
      <div className="mt-4 bg-white rounded-md shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-gray-600 text-sm">
            <tr>
              {["Client Name ⬍", "Phone Number ⬍", "Email ⬍", "Part Requested ⬍", "Status ⬍", "Zip ⬍", "Created At ⬍"].map(
                (header, index) => (
                  <th key={index} className="px-4 py-2 border-b">{header}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead, index) => (
                <tr key={index} className="border-t hover:bg-gray-100">
                  <td
                    className="px-4 py-2 hover:underline hover:bg-[#749fdf] cursor-pointer"
                    onClick={() => navigate(`/lead/${lead._id}`)}
                  >
                    {lead.clientName}
                  </td>
                  <td className="px-4 py-2">{lead.phoneNumber}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">{lead.partRequested}</td>

                  {/* Status Column */}
                  <td className="px-4 py-2 relative">
                    <span
                      className={`cursor-pointer font-semibold ${[lead.status]}`}
                      onClick={() => setEditingLeadId(lead._id)}
                    >
                      {lead.status}
                    </span>

                    {/* Status Dropdown */}
                    {editingLeadId === lead._id && (
                      <div ref={dropdownRef} className="absolute left-0 mt-1 bg-white shadow-lg rounded-md w-40 border z-10">
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
                  <td className="px-4 py-2">{lead.zip}</td>
                  <td className="px-4 py-2">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "N/A"}</td>
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
    </div>
  );
};

export default LeadTableHeader;
