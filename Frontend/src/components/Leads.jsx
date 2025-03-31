import { useState } from "react";
import { Settings, RefreshCw, Filter } from "lucide-react";

const LeadTableHeader = () => {
  // Dummy data (Replace with API data if needed)
  const [leads, setLeads] = useState([
    {
      name: "John Doe",
      company: "Tech Corp",
      state: "California",
      phone: "123-456-7890",
      email: "john@example.com",
      status: "Open",
      createdDate: "2024-03-30",
    },
    {
      name: "Jane Smith",
      company: "Biz Solutions",
      state: "New York",
      phone: "987-654-3210",
      email: "jane@example.com",
      status: "Closed",
      createdDate: "2024-03-29",
    },
  ]);

  return (
    <div className="p-6">
      {/* Button Group */}
      <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/2">
        {["New", "Import", "Send List Email", "Change Owner", "Assign Label"].map((button, index) => (
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
              {["Name", "Company", "State/Province", "Phone", "Email", "Lead Status", "Created Date"].map(
                (header, index) => (
                  <th key={index} className="px-4 py-2 border-b">
                    {header} ⬍
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead, index) => (
                <tr key={index} className="border-t hover:bg-gray-100">
                  <td className="px-4 py-2">{lead.name}</td>
                  <td className="px-4 py-2">{lead.company}</td>
                  <td className="px-4 py-2">{lead.state}</td>
                  <td className="px-4 py-2">{lead.phone}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">{lead.status}</td>
                  <td className="px-4 py-2">{lead.createdDate}</td>
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
