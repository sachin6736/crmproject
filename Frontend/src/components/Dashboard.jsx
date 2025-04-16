import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
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

const Dashboard = () => {
  const [totalClients, setTotalClients] = useState(0);
  const [countbystatus, setCountbystatus] = useState([]);
  const [orders, setOrders] = useState([]);

  const statusColor = {
    Quoted: 'bg-yellow-100 text-yellow-800',
    Ordered: 'bg-green-100 text-green-800',
    // Add other statuses as needed
  };

  useEffect(() => {
    const fetchLeadCount = async () => {
      try {
        const response = await fetch('http://localhost:3000/Admin/getleadcount');
        const data = await response.json();
        setTotalClients(data.leadcount);
      } catch (error) {
        console.error("Error fetching lead count:", error);
      }
    };

    fetchLeadCount();
  }, []);

  useEffect(() => {
    const GetstatusCount = async () => {
      try {
        const response = await fetch('http://localhost:3000/Admin/getcountbystatus');
        const datas = await response.json();
        console.log("Fetched status count data:", datas);
        setCountbystatus(datas);
      } catch (error) {
        console.error("Error fetching statuscount:", error);
      }
    };

    GetstatusCount();
  }, []);

  const getStatusCount = (status) => {
    const statusObj = countbystatus.find(item => item._id === status);
    return statusObj ? statusObj.count : 0;
  };

  useEffect(() => {
    const Getallorders = async () => {
      try {
        const response = await fetch('http://localhost:3000/Admin/getallorders');
        const orders = await response.json();
        console.log("Fetched all orders:", orders);
        setOrders(orders);
      } catch (error) {
        console.error("Error fetching allorders:", error);
      }
    };

    Getallorders();
  }, []);

  const chartData = [
    { month: 'Jan', daily: 300, monthly: 2400 },
    { month: 'Feb', daily: 500, monthly: 1398 },
    { month: 'Mar', daily: 200, monthly: 9800 },
    { month: 'Apr', daily: 278, monthly: 3908 },
    { month: 'May', daily: 189, monthly: 4800 },
  ];

  const team = [
    { name: "Ayesha Khan", role: "Sales Executive" },
    { name: "Ravi Patel", role: "Lead Manager" },
    { name: "John Doe", role: "Support Specialist" },
  ];

  return (
    <div className='w-full min-h-screen bg-[#f9fafb]'>
      {/* Top Stats */}
      <div className='w-full h-48 flex flex-row space-x-16 p-3 pl-20'>
        {/* Ordered */}
        <div className='w-96 h-40 rounded-xl bg-white flex flex-col items-center justify-center shadow-lg p-4'>
          <h3 className="text-gray-500 text-lg">Ordered</h3>
          <span className="text-4xl font-bold text-blue-600">
            {getStatusCount("Ordered")}
          </span>
        </div>
        {/* Quoted */}
        <div className='w-96 h-40 rounded-xl bg-[#ffffff] shadow flex flex-col items-center justify-center'>
          <h3 className="text-gray-500 text-lg">Quoted</h3>
          <span className="text-4xl font-bold text-blue-600">
            {getStatusCount("Quoted")}
          </span>
        </div>
        {/* Total Clients */}
        <div className='w-96 h-40 rounded-xl bg-[#ffffff] shadow flex flex-col items-center justify-center'>
          <h3 className="text-gray-500 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600">{totalClients}</span>
        </div>
      </div>

      {/* Sales Graph + My Team */}
      <div className='w-full h-96 flex flex-row space-x-16 pl-20'>
        {/* Graph */}
        <div className='w-[830px] h-full bg-[#ffffff] rounded-xl border border-slate-200 shadow p-4'>
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height="85%">
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

        {/* My Team */}
        <div className='w-96 h-full bg-[#ffffff] rounded-xl border border-slate-200 shadow p-4'>
          <h3 className="text-lg font-semibold mb-4">My Team</h3>
          <ul className="space-y-3">
            {team.map((member, index) => (
              <li key={index} className="flex flex-col">
                <span className="font-medium text-gray-800">{member.name}</span>
                <span className="text-sm text-gray-500">{member.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Placeholder Boxes */}
      <div className='w-full h-[420px] flex flex-row space-x-16 pl-20 pt-5'>
        <div className='w-[606px] h-96 bg-[#ffffff] rounded-xl border border-slate-200 shadow'></div>
        <div className='w-[607px] h-96 bg-[#ffffff] rounded-xl border border-slate-200 shadow'></div>
      </div>

      {/* Recent Orders Table */}
      <div className='w-full min-h-fit px-6 py-8 pl-20 pr-24'>
        <div className="p-6 bg-white rounded-xl shadow border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="space-x-2">
              <button className="px-4 py-1 border rounded-lg text-sm">Filter</button>
              <button className="px-4 py-1 border rounded-lg text-sm">See all</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
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
                {orders.map((order, index) => (
                  <tr key={index} className="border-b text-sm">
                    <td className="p-2">{order.clientName}</td>
                    <td className="p-2 flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${order.color}`}
                      >
                        {order.email[0]?.toUpperCase()}
                      </div>
                      <div className="text-gray-500">{order.email}</div>
                    </td>
                    <td className="p-2">{order.partRequested}</td>
                    <td className="p-2">{order.date}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor[order.status]}`}
                      >
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
    </div>
  );
};

export default Dashboard;
