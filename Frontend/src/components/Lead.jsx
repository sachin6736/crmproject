import React, { useState, useEffect } from 'react';
import { Triangle, Pencil } from 'lucide-react';
import { useParams } from 'react-router-dom';

const Lead = () => {
  const { id } = useParams();
  const [singleLead, setSingleLead] = useState(null);

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        const response = await fetch(`http://localhost:3000/Lead/getleadbyid/${id}`);
        const data = await response.json();
        setSingleLead(data);
      } catch (error) {
        console.error('Error fetching single lead:', error);
      }
    };

    fetchSingleLead();
  }, [id]);
  console.log("single lead",singleLead);
  

  if (!singleLead) return <div className="p-8">Loading...</div>;

  const leadDetails = [
    { label: 'Client Name', value: singleLead.clientName },
    { label: 'Phone Number', value: singleLead.phoneNumber },
    { label: 'Email', value: singleLead.email, isLink: true },
    { label: 'ZIP Code', value: singleLead.zip },
    { label: 'Part Requested', value: singleLead.partRequested },
    { label: 'Make', value: singleLead.make },
    { label: 'Model', value: singleLead.model },
    { label: 'Year', value: singleLead.year },
    { label: 'Trim', value: singleLead.trim },
    { label: 'Status', value: singleLead.status },
  ];

  return (
    <div className="p-8">
      {/* Top Right Buttons */}
      <div className="flex items-end justify-end">
        <div className="flex justify-start space-x-2 bg-white rounded-full shadow-md p-2 mb-4 w-1/3">
          {['Convert', 'Change Owner', 'Edit', <Triangle size={16} className="rotate-180 fill-blue-500 text-blue-500" />].map((button, index) => (
            <button
              key={index}
              className="px-4 py-2 text-blue-600 border-r last:border-r-0 border-gray-300"
            >
              {button}
            </button>
          ))}
        </div>
      </div>

      {/* Status Buttons */}
      <div className="flex justify-center items-center bg-white rounded-full shadow-md p-2 mb-4 w-full m-2 h-14">
        <div className="bg-[#e5e5e5] p-2 m-2 w-3/4 h-3/4 flex justify-start space-x-2 rounded-full items-center">
          {['Lead', 'Contacted', 'Nurturing', 'Qualified', 'Not Qualified'].map((status, index) => {
            const isActive=singleLead.status === status;
            return(
            <button
              key={index}
              className={`flex items-center justify-center w-40 border-r last:border-r-0 border-gray-300 transition-colors ${
                isActive ? 'bg-[#032d60] text-white' : 'bg-transparent text-black'
              }`}
            >
              {status}
            </button>
            )
        })}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-auto p-2 space-x-2 bg-slate-300 flex items-center justify-center flex-row m-2">
        {/* Left Section - Lead Details */}
        <div className="w-1/3 h-full rounded-2xl bg-slate-50 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold border-b pb-2">
            About
          </h2>
          <div className="mt-2 space-y-2">
            {leadDetails.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-1">
                <span className="text-gray-600 font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.isLink ? (
                    <a
                      href={`mailto:${item.value}`}
                      className="text-blue-500 hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                  <span className="text-gray-400 cursor-pointer hover:text-gray-600">
                    <Pencil size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      <div className="w-1/3 h-full rounded-2xl bg-slate-50"></div>

      <div className="w-1/3 h-full rounded-2xl bg-slate-50"></div>
      </div>
    </div>
  );
};

export default Lead;
