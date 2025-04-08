import React from 'react';
import { Briefcase, Users, LineChart, Headset, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* Welcome Message */}
      <h1 className="text-2xl font-bold text-gray-800">Welcome to Your CRM Dashboard</h1>
      <p className="text-gray-600 mt-1">Manage your sales, customers, and business activities in one place.</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mt-6">
        <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md flex flex-col items-center">
          <Users className="h-8 w-8" />
          <p className="text-lg font-bold">1,200</p>
          <span className="text-sm">Total Customers</span>
        </div>

        <div className="p-4 bg-green-500 text-white rounded-lg shadow-md flex flex-col items-center">
          <Briefcase className="h-8 w-8" />
          <p className="text-lg font-bold">350</p>
          <span className="text-sm">Active Deals</span>
        </div>

        <div className="p-4 bg-yellow-500 text-white rounded-lg shadow-md flex flex-col items-center">
          <LineChart className="h-8 w-8" />
          <p className="text-lg font-bold">$45K</p>
          <span className="text-sm">Monthly Revenue</span>
        </div>

        <div className="p-4 bg-red-500 text-white rounded-lg shadow-md flex flex-col items-center">
          <Headset className="h-8 w-8" />
          <p className="text-lg font-bold">50</p>
          <span className="text-sm">Pending Support Tickets</span>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
        <ul className="mt-2 bg-white p-4 rounded-lg shadow-md">
          <li className="border-b py-2">✅ John Doe closed a deal worth $5,000</li>
          <li className="border-b py-2">📞 Support ticket #12345 was resolved</li>
          <li className="border-b py-2">🆕 New lead added: Jane Smith</li>
          <li className="py-2">📢 Marketing campaign "Spring Offer" launched</li>
        </ul>
      </div>

      {/* Quick Navigation */}
      <div className="mt-6 flex gap-4">
        <button 
          onClick={() => navigate('/sales')} 
          className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600"
        >
          View Sales
        </button>
        <button 
          onClick={() => navigate('/userform')} 
          className="bg-green-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-600"
        >
          Add New Contact
        </button>
      </div>
    </div>
  );
}
