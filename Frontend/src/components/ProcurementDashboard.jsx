import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
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

const ProcurementOrderDetailsModal = ({ isOpen, onClose, statusComparison = { currentMonth: {}, previousMonth: {} }, orderAmountTotals = { today: 0, currentMonth: 0 }, onMonthChange, onYearChange, selectedMonth, selectedYear, poSentOrders = [], poSentCount = 0, poSentTotalAmount = 0, viewMode = 'full' }) => {
  if (!isOpen) return null;

  const { theme } = useTheme();

  const statusColors = {
    LocatePending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    POPending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    POSent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    POConfirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    VendorPaymentPending: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    VendorPaymentConfirmed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    ShippingPending: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    ShipOut: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    Intransit: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    Delivered: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
    Replacement: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Litigation: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    ReplacementCancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    TotalOrders: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
  };

  const lineColors = {
    currentMonth: "#8884d8",
    previousMonth: "#82ca9d",
    selectedMonth: "#ff7300",
    selectedYear: "#d81b60",
  };

  const statuses = [
    "LocatePending",
    "POPending",
    "POSent",
    "POConfirmed",
    "VendorPaymentPending",
    "VendorPaymentConfirmed",
    "ShippingPending",
    "ShipOut",
    "Intransit",
    "Delivered",
    "Replacement",
    "Litigation",
    "ReplacementCancelled",
    "TotalOrders",
  ];

  const calculateTotal = (data) => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
  };

  const chartData = statuses.map(status => ({
    status: status === "TotalOrders" ? "Total Orders" : status.replace(/([A-Z])/g, " $1").trim(),
    currentMonth: status === "TotalOrders" ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0,
    previousMonth: status === "TotalOrders" ? calculateTotal(statusComparison.previousMonth) : statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth ? { selectedMonth: status === "TotalOrders" ? calculateTotal(statusComparison.selectedMonth) : statusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && statusComparison.selectedYear ? { selectedYear: status === "TotalOrders" ? calculateTotal(statusComparison.selectedYear) : statusComparison.selectedYear[status] || 0 } : {}),
  }));

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("default", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  };

  const generateYearOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let i = currentYear - 5; i <= currentYear; i++) {
      options.push({ value: String(i), label: String(i) });
    }
    return options;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 px-2 sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-2xl lg:max-w-4xl max-h-[80vh] overflow-y-auto"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        {viewMode === 'poSent' ? (
          <>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">PO Sent Order Details</h3>
            {poSentOrders.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <table className="min-w-full table-auto text-sm sm:text-base">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        <th className="p-2 sm:p-3">Order ID</th>
                        <th className="p-2 sm:p-3">Client Name</th>
                        <th className="p-2 sm:p-3">Vendor Name</th>
                        <th className="p-2 sm:p-3">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poSentOrders.map((order) => {
                        const poSentVendor = order.vendors.find(vendor => vendor.poStatus === 'PO Sent');
                        return (
                          <tr
                            key={order.order_id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{order.order_id}</td>
                            <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                            <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{poSentVendor?.businessName || 'N/A'}</td>
                            <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">${(poSentVendor?.totalCost || 0).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between w-full sm:w-auto mb-2 sm:mb-0">
                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total PO Sent Orders</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 ml-4">{poSentCount}</span>
                  </div>
                  <div className="flex justify-between w-full sm:w-auto">
                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total PO Sent Amount</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 ml-4">${(poSentTotalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">No PO Sent orders available.</p>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Order Status Comparison</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Today's Total</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.today || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Current Month Total</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.currentMonth || 0).toFixed(2)}</span>
                </div>
                {selectedMonth && (
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Selected Month ({selectedMonth}) Total</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedMonth || 0).toFixed(2)}</span>
                  </div>
                )}
                {selectedYear && (
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Selected Year ({selectedYear}) Total</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedYear || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">PO Sent Orders</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{poSentCount}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">PO Sent Total Amount</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${(poSentTotalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <select
                  className="w-full sm:w-1/2 border p-1.5 sm:p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm sm:text-base"
                  value={selectedMonth || ""}
                  onChange={(e) => onMonthChange(e.target.value)}
                >
                  <option value="">Select Month to Compare</option>
                  {generateMonthOptions().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  className="w-full sm:w-1/2 border p-1.5 sm:p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm sm:text-base"
                  value={selectedYear || ""}
                  onChange={(e) => onYearChange(e.target.value)}
                >
                  <option value="">Select Year to Compare</option>
                  {generateYearOptions().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                  <XAxis dataKey="status" stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} tick={{ fontSize: 12 }} />
                  <YAxis stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                      color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ color: theme === 'dark' ? '#D1D5DB' : '#1F2937', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="currentMonth" stroke={lineColors.currentMonth} name="Current Month" />
                  <Line type="monotone" dataKey="previousMonth" stroke={lineColors.previousMonth} name="Previous Month" />
                  {selectedMonth && (
                    <Line type="monotone" dataKey="selectedMonth" stroke={lineColors.selectedMonth} name="Selected Month" />
                  )}
                  {selectedYear && (
                    <Line type="monotone" dataKey="selectedYear" stroke={lineColors.selectedYear} name="Selected Year" />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {statuses.map(status => (
                  <div
                    key={status}
                    className={`p-2 sm:p-3 rounded-lg text-center ${statusColors[status]}`}
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      {status === "TotalOrders"
                        ? "Total Orders"
                        : status.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <div className="text-sm sm:text-md font-bold">
                      {status === "TotalOrders" ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0}
                    </div>
                  </div>
                ))}
              </div>
              {poSentOrders.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-gray-900 dark:text-gray-100">PO Sent Order Details</h4>
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <table className="min-w-full table-auto text-sm sm:text-base">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                          <th className="p-2 sm:p-3">Order ID</th>
                          <th className="p-2 sm:p-3">Client Name</th>
                          <th className="p-2 sm:p-3">Vendor Name</th>
                          <th className="p-2 sm:p-3">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poSentOrders.map((order) => {
                          const poSentVendor = order.vendors.find(vendor => vendor.poStatus === 'PO Sent');
                          return (
                            <tr
                              key={order.order_id}
                              className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{order.order_id}</td>
                              <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                              <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">{poSentVendor?.businessName || 'N/A'}</td>
                              <td className="p-2 sm:p-3 text-gray-900 dark:text-gray-100">${(poSentVendor?.totalCost || 0).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-3 sm:mt-4">
          <button
            className="px-3 sm:px-4 py-1 sm:py-1.5 border rounded-lg text-sm sm:text-base text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProcurementDashboard = () => {
  const { theme } = useTheme();
  const [totalOrders, setTotalOrders] = useState(0);
  const [poSentCount, setPoSentCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [poSentTotalAmount, setPoSentTotalAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [poSentOrders, setPoSentOrders] = useState([]);
  const [orderStatusComparison, setOrderStatusComparison] = useState({ currentMonth: {}, previousMonth: {} });
  const [orderAmountTotals, setOrderAmountTotals] = useState({ today: 0, currentMonth: 0 });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [user, setUser] = useState(null);

  const statusColor = {
    POSent: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    Delivered: 'bg-lime-100 dark:bg-lime-900 text-lime-800 dark:text-lime-200',
  };

  const statuses = [
    "LocatePending",
    "POPending",
    "POSent",
    "POConfirmed",
    "VendorPaymentPending",
    "VendorPaymentConfirmed",
    "ShippingPending",
    "ShipOut",
    "Intransit",
    "Delivered",
    "Replacement",
    "Litigation",
    "ReplacementCancelled",
    "TotalOrders",
  ];

  const calculateTotal = (data) => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/User/me', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user info:', err);
        toast.error('Failed to load user data');
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProcurementData = async () => {
      if (!user?._id) return;
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        query.push(`procurementPerson=${user._id}`);
        const queryString = query.length ? `?${query.join('&')}` : '';

        const [ordersRes, statusComparisonRes, orderAmountTotalsRes] = await Promise.all([
          fetch(`http://localhost:3000/Procurement/getProcurementOrders${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`http://localhost:3000/Procurement/getProcurementOrderStatusComparison${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`http://localhost:3000/Procurement/getProcurementOrderAmountTotals${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
        ]);

        const errors = [];
        if (!ordersRes.ok) errors.push(`Failed to fetch procurement orders: ${ordersRes.status}`);
        if (!statusComparisonRes.ok) errors.push(`Failed to fetch order status comparison: ${statusComparisonRes.status}`);
        if (!orderAmountTotalsRes.ok) errors.push(`Failed to fetch order amount totals: ${orderAmountTotalsRes.status}`);

        if (errors.length) {
          console.error("Fetch errors:", errors);
          errors.forEach(error => toast.error(error));
          return;
        }

        const ordersData = await ordersRes.json();
        const statusComparisonData = await statusComparisonRes.json();
        const orderAmountTotalsData = await orderAmountTotalsRes.json();

        console.log("Fetched data:", {
          ordersData,
          statusComparisonData,
          orderAmountTotalsData,
        });

        const poSentOrdersData = ordersData.filter(order => order.status === 'PO Sent' && order.vendors.some(vendor => vendor.poStatus === 'PO Sent'));
        const poSentCountData = poSentOrdersData.length;
        const poSentTotalAmountData = poSentOrdersData.reduce((sum, order) => {
          const poSentVendor = order.vendors.find(vendor => vendor.poStatus === 'PO Sent');
          return sum + (poSentVendor?.totalCost || 0);
        }, 0);

        setTotalOrders(ordersData.length || 0);
        setPoSentCount(poSentCountData);
        setDeliveredCount(ordersData.filter((order) => order.status === 'Delivered').length || 0);
        setPoSentTotalAmount(poSentTotalAmountData);
        setOrders(ordersData || []);
        setPoSentOrders(poSentOrdersData || []);
        setOrderStatusComparison(statusComparisonData || { currentMonth: {}, previousMonth: {} });
        setOrderAmountTotals(orderAmountTotalsData || { today: 0, currentMonth: 0 });
      } catch (error) {
        console.error("Fetch procurement data error:", error);
        toast.error(`Error fetching data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchProcurementData();
    }
  }, [user, selectedMonth, selectedYear]);

  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:3000/Order/delete/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Order deleted successfully');
        setOrders((prevOrders) => prevOrders.filter((order) => order.order_id !== orderId));
        setPoSentOrders((prevOrders) => prevOrders.filter((order) => order.order_id !== orderId));
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
      <div className="flex flex-wrap gap-6 p-3 px-4 sm:px-20">
        {['POSent', 'Delivered'].map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
              setViewMode(status === 'POSent' ? 'poSent' : 'full');
              setShowOrderDetailsModal(true);
            }}
          >
            <h3 className="text-gray-500 dark:text-gray-400 text-lg">{status.replace(/([A-Z])/g, ' $1').trim()}</h3>
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {status === 'POSent' ? poSentCount : deliveredCount}
            </span>
          </div>
        ))}
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            setViewMode('full');
            setShowOrderDetailsModal(true);
          }}
        >
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Total Orders</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</span>
        </div>
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            setViewMode('full');
            setShowOrderDetailsModal(true);
          }}
        >
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Today's Total</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.today || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 p-6 px-4 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Order Status Comparison</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month to Compare</option>
                {(() => {
                  const options = [];
                  const now = new Date();
                  for (let i = 0; i < 12; i++) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    options.push({ value, label });
                  }
                  return options;
                })().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select Year to Compare</option>
                {(() => {
                  const options = [];
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  for (let i = currentYear - 5; i <= currentYear; i++) {
                    options.push({ value: String(i), label: String(i) });
                  }
                  return options;
                })().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={statuses.map((status) => ({
                  status: status === 'TotalOrders' ? 'Total Orders' : status.replace(/([A-Z])/g, ' $1').trim(),
                  currentMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.currentMonth) : orderStatusComparison.currentMonth?.[status] || 0,
                  previousMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.previousMonth) : orderStatusComparison.previousMonth?.[status] || 0,
                  ...(selectedMonth && orderStatusComparison.selectedMonth
                    ? { selectedMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.selectedMonth) : orderStatusComparison.selectedMonth[status] || 0 }
                    : {}),
                  ...(selectedYear && orderStatusComparison.selectedYear
                    ? { selectedYear: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.selectedYear) : orderStatusComparison.selectedYear[status] || 0 }
                    : {}),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                <XAxis dataKey="status" stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} tick={{ fontSize: 12 }} />
                <YAxis stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                    color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ color: theme === 'dark' ? '#D1D5DB' : '#1F2937', fontSize: '12px' }} />
                <Line type="monotone" dataKey="currentMonth" stroke="#8884d8" name="Current Month" />
                <Line type="monotone" dataKey="previousMonth" stroke="#82ca9d" name="Previous Month" />
                {selectedMonth && (
                  <Line type="monotone" dataKey="selectedMonth" stroke="#ff7300" name="Selected Month" />
                )}
                {selectedYear && (
                  <Line type="monotone" dataKey="selectedYear" stroke="#d81b60" name="Selected Year" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-600 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Procurement Orders</h2>
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
                <th className="p-2">Part Requested</th>
                <th className="p-2">Vendor Name</th>
                <th className="p-2">PO Status</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.order_id}
                  className="border-b border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.partRequested}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.vendors?.[0]?.businessName || 'N/A'}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor[order.vendors?.[0]?.poStatus] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                      {order.vendors?.[0]?.poStatus?.replace(/([A-Z])/g, ' $1').trim() || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor[order.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                      {order.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </td>
                  <td className="p-2">
                    <Trash2
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      onClick={() => handleDeleteOrder(order.order_id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showOrderDetailsModal && orderAmountTotals && orderStatusComparison && (
          <ProcurementOrderDetailsModal
            isOpen={showOrderDetailsModal}
            onClose={() => {
              setShowOrderDetailsModal(false);
              setSelectedMonth('');
              setSelectedYear('');
              setViewMode('full');
            }}
            statusComparison={orderStatusComparison}
            orderAmountTotals={orderAmountTotals}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            poSentOrders={poSentOrders}
            poSentCount={poSentCount}
            poSentTotalAmount={poSentTotalAmount}
            viewMode={viewMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProcurementDashboard;