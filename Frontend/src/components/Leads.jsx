import { useState, useEffect } from "react";

const LeadTableHeader = () => {
  const [leads, setLeads] = useState([]);

  // Fetch leads from the API when the component mounts
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

  return (
    <div className="p-6">
      {/* Button Group */}
      <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/2">
        {["New", "Import", "contacts", "calender", "testing"].map((button, index) => (
          <button
            key={index}
            className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300"
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
              {["Client Name  ⬍", "Phone Number  ⬍", "Email  ⬍", "Part Requested  ⬍", "Status  ⬍", "Zip  ⬍", "Created At  ⬍"].map(
                (header, index) => (
                  <th key={index} className="px-4 py-2 border-b">
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead, index) => (
                <tr key={index} className="border-t hover:bg-gray-100">
                  <td className="px-4 py-2">{lead.clientName} </td>
                  <td className="px-4 py-2">{lead.phoneNumber}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">{lead.partRequested}</td>
                  <td className="px-4 py-2">{lead.status}</td>
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
