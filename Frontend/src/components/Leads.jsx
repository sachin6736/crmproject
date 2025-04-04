import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeadTableHeader = () => {
  const [leads, setLeads] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const navigate = useNavigate();

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

  const updateStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/Lead/updatelead/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  // Status text colors (only text is colored)
  const statusTextColors = {
    Lead: "text-blue-600",
    Contacted: "text-yellow-500",
    Nurturing: "text-purple-600",
    Qualified: "text-green-600",
    "Not Qualified": "text-red-600",
  };

  return (
    <div className="p-8">
      {/* Button Group */}
      <div className=" flex items-end justify-end">
      <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/3">
        {["New", "Import", "contacts", "calender", "testing"].map((button, index) => (
          <button
            key={index}
            className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300"
          >
            {button}
          </button>
        ))}
      </div>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white rounded-md shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-gray-600 text-sm">
            <tr>
              {["Client Name  ⬍", "Phone Number ⬍", "Email ⬍", "Part Requested  ⬍", "Status  ⬍", "Zip  ⬍", "Created At ⬍"].map(
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
                  <td className="px-4 py-2 hover:underline hover:decoration-slate-700 hover:bg-[#749fdf] cursor-pointer" onClick={() => navigate(`/lead/${lead._id}`)}>{lead.clientName} </td>
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
                      <div className="absolute left-0 mt-1 bg-white shadow-lg rounded-md w-40 border z-10">
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
                  <td className="px-4 py-2">{new Date(lead.createdAt).toLocaleString()}</td>
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
