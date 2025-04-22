import React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FullPageLoader from './utilities/FullPageLoader';
import { useState,useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SalesDashboard = () => {

  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  const statusColor = {
    Quoted: 'bg-yellow-100 text-yellow-800',
    Ordered: 'bg-green-100 text-green-800',
  };

  const chartData = [
    { month: 'Jan', daily: 300, monthly: 2400 },
    { month: 'Feb', daily: 500, monthly: 1398 },
    { month: 'Mar', daily: 200, monthly: 9800 },
    { month: 'Apr', daily: 278, monthly: 3908 },
    { month: 'May', daily: 189, monthly: 4800 },
  ];

  

  const mockOrders = [
    {
      clientName: 'Client A',
      email: 'clienta@example.com',
      partRequested: 'Part 1',
      date: '2025-04-17',
      status: 'Ordered',
    },
    {
      clientName: 'Client B',
      email: 'clientb@example.com',
      partRequested: 'Part 2',
      date: '2025-04-16',
      status: 'Quoted',
    },
  ];

  useEffect(() => {
    const fetchSingleSales = async () => {
      try {
        const response = await fetch('http://localhost:3000/Sales/getsingleleads', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();
        // console.log("data",data)
        setTotalClients(data.length);
      } catch (error) {
        toast.error("Failed to fetch sales data");
        console.error("Error fetching single sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleSales();
  }, []);

  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FullPageLoader size="w-10 h-10" color="text-blue-500" fill="fill-blue-300" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f9fafb]">
      {/* Top Stats */}
      <div className="flex flex-wrap gap-6 p-3 px-6 sm:px-20">
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 text-lg">Ordered</h3>
          <span className="text-4xl font-bold text-blue-600">will integrate soon</span>
        </div>
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 text-lg">Quoted</h3>
          <span className="text-4xl font-bold text-blue-600">5</span>
        </div>
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600">{totalClients}</span>
        </div>
      </div>

      {/* Sales Graph + My Team */}
      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="daily" stroke="#8884d8" name="Daily Sales" />
              <Line type="monotone" dataKey="monthly" stroke="#82ca9d" name="Monthly Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:max-w-sm bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Calender</h3>
          {/* <ul className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {mockTeamUsers.map((member, index) => (
              <li
                key={index}
                className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{member.name}</span>
                  <span className="text-sm text-gray-500 capitalize">{member.role.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-400">{member.email}</span>
                </div>
              </li>
            ))}
          </ul> */}
        </div>
      </div>

      {/* Placeholder Boxes */}
      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] h-96 bg-white rounded-xl shadow"></div>
        <div className="flex-1 min-w-[300px] h-96 bg-white rounded-xl shadow"></div>
      </div>

      {/* Recent Orders */}
      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="space-x-2">
              <button className="px-4 py-1 border rounded-lg text-sm">Filter</button>
              <button className="px-4 py-1 border rounded-lg text-sm">See all</button>
            </div>
          </div>

          <table className="min-w-[700px] w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="p-2">Client Name</th>
                <th className="p-2 pl-14">Email</th>
                <th className="p-2">Part Requested</th>
                <th className="p-2">Close Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order, index) => (
                <tr key={index} className="border-b text-sm">
                  <td className="p-2">{order.clientName}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-400">
                      {order.email[0].toUpperCase()}
                    </div>
                    <div className="text-gray-500">{order.email}</div>
                  </td>
                  <td className="p-2">{order.partRequested}</td>
                  <td className="p-2">{order.date}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
