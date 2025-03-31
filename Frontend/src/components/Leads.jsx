import { Settings, RefreshCw, Filter } from "lucide-react";

const LeadTableHeader = () => {
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
      
      {/* Table Header */}
      <div className="mt-4 bg-white rounded-md shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-gray-600 text-sm">
            <tr>
              {["Name", "Company", "State/Province", "Phone", "Email", "Lead Status", "Created Date"].map(
                (header, index) => (
                  <th key={index} className="px-4 py-2">
                    {header} ⬍
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-center" colSpan={7}>No data available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTableHeader;
