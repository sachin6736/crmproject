import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FullPageLoader from './utilities/FullPageLoader';
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
import { useTheme } from '../context/ThemeContext';

const SalesDashboard = () => {
  const { theme } = useTheme();
  const [totalClients, setTotalClients] = useState(0);
  const [orderedCount, setOrderedCount] = useState(0);
  const [quotedCount, setQuotedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const statusColor = {
    Quoted: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    Ordered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
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
      id: '1',
      clientName: 'Client A',
      email: 'clienta@example.com',
      partRequested: 'Part 1',
      date: '2025-04-17',
      status: 'Ordered',
    },
    {
      id: '2',
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
        if (!response.ok) throw new Error('Failed to fetch sales data');
        const data = await response.json();
        setTotalClients(data.length);
        setOrderedCount(data.filter((lead) => lead.status === 'Ordered').length);
        setQuotedCount(data.filter((lead) => lead.status === 'Quoted').length);
      } catch (error) {
        toast.error('Failed to fetch sales data');
        console.error('Error fetching single sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleSales();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:3000/Order/delete/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Order deleted successfully');
        // Optionally, refetch orders or filter out the deleted order
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete order');
      }
    } catch (error) {
      toast.error('Network error: Unable to delete order');
      console.error('Error deleting order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <FullPageLoader
          size="w-10 h-10"
          color="text-blue-500 dark:text-blue-400"
          fill="fill-blue-300 dark:fill-blue-600"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top Stats */}
      <div className="flex flex-wrap gap-6 p-3 px-4 sm:px-20">
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Ordered</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{orderedCount}</span>
        </div>
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Quoted</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{quotedCount}</span>
        </div>
        <div className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4">
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalClients}</span>
        </div>
      </div>

      {/* Sales Graph + Calendar */}
      <div className="flex flex-wrap gap-6 p-6 px-4 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#D1D5DB' : '#374151'} />
              <YAxis stroke={theme === 'dark' ? '#D1D5DB' : '#374151'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                }}
              />
              <Legend wrapperStyle={{ color: theme === 'dark' ? '#D1D5DB' : '#374151' }} />
              <Line
                type="monotone"
                dataKey="daily"
                stroke={theme === 'dark' ? '#A5B4FC' : '#8884d8'}
                name="Daily Sales"
              />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke={theme === 'dark' ? '#6EE7B7' : '#82ca9d'}
                name="Monthly Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Calendar</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Calendar integration coming soon
          </p>
        </div>
      </div>

      {/* Placeholder Boxes */}
      <div className="flex flex-wrap gap-6 p-6 px-4 sm:px-20">
        <div className="flex-1 min-w-[300px] h-96 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            Placeholder for future content
          </div>
        </div>
        <div className="flex-1 min-w-[300px] h-96 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            Placeholder for future content
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-slate-200 dark:border-gray-600 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="space-x-2">
              <button className="px-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Filter
              </button>
              <button className="px-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                See all
              </button>
            </div>
          </div>

          <table className="min-w-[700px] w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <th className="p-2">Client Name</th>
                <th className="p-2 pl-14">Email</th>
                <th className="p-2">Part Requested</th>
                <th className="p-2">Close Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2">{order.clientName}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-400 dark:bg-blue-500">
                      {order.email[0].toUpperCase()}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{order.email}</div>
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
                    <Trash2
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      onClick={() => handleDeleteOrder(order.id)}
                    />
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