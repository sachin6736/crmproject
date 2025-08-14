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
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '../context/ThemeContext';

const localizer = momentLocalizer(moment);

const LeadDetailsModal = ({ isOpen, onClose, createdByUser, assignedAutomatically, statusComparison, onMonthChange, onYearChange, selectedMonth, selectedYear }) => {
  if (!isOpen) return null;

  const { theme } = useTheme();

  const statusColors = {
    Quoted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    NoResponse: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    WrongNumber: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    NotInterested: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    PriceTooHigh: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    PartNotAvailable: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Ordered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    TotalLeads: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const lineColors = {
    currentMonth: "#8884d8",
    previousMonth: "#82ca9d",
    selectedMonth: "#ff7300",
    selectedYear: "#d81b60",
  };

  const statuses = [
    "Quoted",
    "NoResponse",
    "WrongNumber",
    "NotInterested",
    "PriceTooHigh",
    "PartNotAvailable",
    "Ordered",
    "TotalLeads",
  ];

  const calculateTotal = (data) => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
  };

  const chartData = statuses.map(status => ({
    status: status === "TotalLeads" ? "Total Leads" : status,
    currentMonth: status === "TotalLeads" ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0,
    previousMonth: status === "TotalLeads" ? calculateTotal(statusComparison.previousMonth) : statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth ? { selectedMonth: status === "TotalLeads" ? calculateTotal(statusComparison.selectedMonth) : statusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && statusComparison.selectedYear ? { selectedYear: status === "TotalLeads" ? calculateTotal(statusComparison.selectedYear) : statusComparison.selectedYear[status] || 0 } : {}),
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Lead Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Leads Created by You</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{createdByUser}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Leads Assigned to You</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{assignedAutomatically}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lead Status Comparison</h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedMonth || ""}
                onChange={(e) => onMonthChange(e.target.value)}
              >
                <option value="">Select Month to Compare</option>
                {generateMonthOptions().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
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
                  className={`p-2 rounded-lg text-center ${statusColors[status.replace(" ", "")]}`}
                >
                  <span className="text-xs font-medium">
                    {status === "TotalLeads"
                      ? "Total Leads"
                      : status.replace("PriceTooHigh", "Price Too High").replace("PartNotAvailable", "Part Not Available").replace("NoResponse", "No Response")}
                  </span>
                  <div className="text-md font-bold">
                    {status === "TotalLeads" ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const OrderDetailsModal = ({ isOpen, onClose, statusComparison = { currentMonth: {}, previousMonth: {}, today: {}, currentYear: {} }, orderAmountTotals = { today: 0, currentMonth: 0, currentYear: 0 }, onMonthChange, onYearChange, selectedMonth, selectedYear }) => {
  if (!isOpen) return null;

  const { theme } = useTheme();

  console.log("OrderDetailsModal - statusComparison:", statusComparison);
  console.log("OrderDetailsModal - orderAmountTotals:", orderAmountTotals);

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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Details</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Today's Order Count</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotal(statusComparison.today) || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Today's Order Amount</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.today || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Current Month's Order Count</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotal(statusComparison.currentMonth) || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Current Month's Order Amount</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.currentMonth || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Current Year's Order Count</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotal(statusComparison.currentYear) || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Current Year's Order Amount</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.currentYear || 0).toFixed(2)}</span>
            </div>
            {selectedMonth && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Month ({selectedMonth}) Order Count</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotal(statusComparison.selectedMonth) || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Month ({selectedMonth}) Order Amount</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedMonth || 0).toFixed(2)}</span>
                </div>
              </>
            )}
            {selectedYear && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Year ({selectedYear}) Order Count</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculateTotal(statusComparison.selectedYear) || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Year ({selectedYear}) Order Amount</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedYear || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
              value={selectedMonth || ""}
              onChange={(e) => onMonthChange(e.target.value)}
            >
              <option value="">Select Month to Compare</option>
              {generateMonthOptions().map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
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
                className={`p-2 rounded-lg text-center ${statusColors[status]}`}
              >
                <span className="text-xs font-medium">
                  {status === "TotalOrders"
                    ? "Total Orders"
                    : status.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div className="text-md font-bold">
                  {status === "TotalOrders" ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SalesDashboard = () => {
  const { theme } = useTheme();
  const [totalClients, setTotalClients] = useState(0);
  const [orderedCount, setOrderedCount] = useState(0);
  const [quotedCount, setQuotedCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [orderStatusComparison, setOrderStatusComparison] = useState({ currentMonth: {}, previousMonth: {}, today: {}, currentYear: {} });
  const [leadStatusComparison, setLeadStatusComparison] = useState({ currentMonth: {}, previousMonth: {} });
  const [leadCreationCounts, setLeadCreationCounts] = useState({ createdByUser: 0, assignedAutomatically: 0 });
  const [orderAmountTotals, setOrderAmountTotals] = useState({ today: 0, currentMonth: 0, currentYear: 0 });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLeadDetailsModal, setShowLeadDetailsModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const statusColor = {
    Quoted: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    Ordered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  };

  const lineColors = {
    currentMonth: '#8884d8',
    previousMonth: '#82ca9d',
    selectedMonth: '#ff7300',
    selectedYear: '#d81b60',
  };

  const statuses = [
    'LocatePending',
    'POPending',
    'POSent',
    'POConfirmed',
    'VendorPaymentPending',
    'VendorPaymentConfirmed',
    'ShippingPending',
    'ShipOut',
    'Intransit',
    'Delivered',
    'Replacement',
    'Litigation',
    'ReplacementCancelled',
    'TotalOrders',
  ];

  const calculateTotal = (data) => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
  };

  const chartData = statuses.map(status => ({
    status: status === 'TotalOrders' ? 'Total Orders' : status.replace(/([A-Z])/g, ' $1').trim(),
    currentMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.currentMonth) : orderStatusComparison.currentMonth?.[status] || 0,
    previousMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.previousMonth) : orderStatusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && orderStatusComparison.selectedMonth ? { selectedMonth: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.selectedMonth) : orderStatusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && orderStatusComparison.selectedYear ? { selectedYear: status === 'TotalOrders' ? calculateTotal(orderStatusComparison.selectedYear) : orderStatusComparison.selectedYear[status] || 0 } : {}),
  }));

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join('&')}` : '';

        const [leadsRes, ordersRes, statusComparisonRes, leadStatusComparisonRes, leadCreationCountsRes, orderAmountTotalsRes] = await Promise.all([
          fetch('http://localhost:3000/Sales/getsingleleads', {
            method: 'GET',
            credentials: 'include',
          }),
          fetch('http://localhost:3000/Sales/getsingleorders', {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`http://localhost:3000/Sales/getOrderStatusComparison${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`http://localhost:3000/Sales/getLeadStatusComparison${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch('http://localhost:3000/Sales/getLeadCreationCounts', {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`http://localhost:3000/Sales/getOrderAmountTotals${queryString}`, {
            method: 'GET',
            credentials: 'include',
          }),
        ]);

        const errors = [];
        if (!leadsRes.ok) errors.push(`Failed to fetch sales leads: ${leadsRes.status}`);
        if (!ordersRes.ok) errors.push(`Failed to fetch sales orders: ${ordersRes.status}`);
        if (!statusComparisonRes.ok) errors.push(`Failed to fetch order status comparison: ${statusComparisonRes.status}`);
        if (!leadStatusComparisonRes.ok) errors.push(`Failed to fetch lead status comparison: ${leadStatusComparisonRes.status}`);
        if (!leadCreationCountsRes.ok) errors.push(`Failed to fetch lead creation counts: ${leadCreationCountsRes.status}`);
        if (!orderAmountTotalsRes.ok) errors.push(`Failed to fetch order amount totals: ${orderAmountTotalsRes.status}`);

        if (errors.length) {
          console.error("Fetch errors:", errors);
          errors.forEach(error => toast.error(error));
          return;
        }

        const leadsData = await leadsRes.json();
        const ordersData = await ordersRes.json();
        const statusComparisonData = await statusComparisonRes.json();
        const leadStatusComparisonData = await leadStatusComparisonRes.json();
        const leadCreationCountsData = await leadCreationCountsRes.json();
        const orderAmountTotalsData = await orderAmountTotalsRes.json();

        console.log("Fetched data:", {
          leadsData,
          ordersData,
          statusComparisonData,
          leadStatusComparisonData,
          leadCreationCountsData,
          orderAmountTotalsData,
        });

        setTotalClients(leadsData.length || 0);
        setOrderedCount(leadsData.filter((lead) => lead.status === 'Ordered').length || 0);
        setQuotedCount(leadsData.filter((lead) => lead.status === 'Quoted').length || 0);
        setOrders(ordersData || []);
        setOrderStatusComparison(statusComparisonData || { currentMonth: {}, previousMonth: {}, today: {}, currentYear: {} });
        setLeadStatusComparison(leadStatusComparisonData || { currentMonth: {}, previousMonth: {} });
        setLeadCreationCounts({
          createdByUser: leadCreationCountsData.createdByUser || 0,
          assignedAutomatically: leadCreationCountsData.assignedAutomatically || 0,
        });
        setOrderAmountTotals(orderAmountTotalsData || { today: 0, currentMonth: 0, currentYear: 0 });

        const events = leadsData.flatMap(lead =>
          lead.importantDates?.map(date => ({
            title: `${lead.clientName} - ${lead.partRequested}`,
            start: new Date(date),
            end: new Date(date),
            allDay: true,
          })) || []
        );
        setCalendarEvents(events);
      } catch (error) {
        console.error("Fetch sales data error:", error);
        toast.error(`Error fetching data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [selectedMonth, selectedYear]);

  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:3000/Order/delete/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Order deleted successfully');
        setOrders((prevOrders) => prevOrders.filter((order) => order.order_id !== orderId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete order');
      }
    } catch (error) {
      toast.error('Network error: Unable to delete order');
      console.error('Error deleting order:', error);
    }
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    return {
      style: {
        backgroundColor: '#ef4444',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
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
        {['Ordered', 'Quoted'].map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
              if (status === 'Ordered') {
                setShowOrderDetailsModal(true);
              } else if (status === 'Quoted') {
                setShowLeadDetailsModal(true);
              }
            }}
          >
            <h3 className="text-gray-500 dark:text-gray-400 text-lg">{status}</h3>
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {status === 'Ordered' ? orderedCount : quotedCount}
            </span>
          </div>
        ))}
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => setShowLeadDetailsModal(true)}
        >
          <h3 className="text-gray-500 dark:text-gray-400 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalClients}</span>
        </div>
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => setShowOrderDetailsModal(true)}
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
          </div>
        </div>

        <div className="w-full sm:max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Calendar</h3>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 300 }}
            eventPropGetter={eventStyleGetter}
            className="rbc-calendar-custom"
          />
        </div>
      </div>

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

      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-600 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
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
              {orders.map((order) => (
                <tr
                  key={order.order_id}
                  className="border-b border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-400 dark:bg-blue-500">
                      {order.email[0].toUpperCase()}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{order.email}</div>
                  </td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.partRequested}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.createdAt.split('T')[0]}</td>
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
        {showLeadDetailsModal && (
          <LeadDetailsModal
            isOpen={showLeadDetailsModal}
            onClose={() => {
              setShowLeadDetailsModal(false);
              setSelectedMonth('');
              setSelectedYear('');
            }}
            createdByUser={leadCreationCounts.createdByUser}
            assignedAutomatically={leadCreationCounts.assignedAutomatically}
            statusComparison={leadStatusComparison}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}
        {showOrderDetailsModal && orderAmountTotals && orderStatusComparison && (
          <OrderDetailsModal
            isOpen={showOrderDetailsModal}
            onClose={() => {
              setShowOrderDetailsModal(false);
              setSelectedMonth('');
              setSelectedYear('');
            }}
            statusComparison={orderStatusComparison}
            orderAmountTotals={orderAmountTotals}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesDashboard;