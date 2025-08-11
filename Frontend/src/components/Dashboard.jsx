import React, { useState, useEffect } from "react";
import { Trash2, Plus, MoreVertical, CheckCircle, Coffee, Utensils, Calendar, LogOut } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import FullPageLoader from "./utilities/FullPageLoader";
import { useTheme } from "../context/ThemeContext";

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, action, userName }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-xs"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Confirm {action}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          Are you sure you want to {action.toLowerCase()} for {userName}?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
              <span className="text-gray-600 dark:text-gray-300 text-xs">Leads Created by Users</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{createdByUser}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Leads Automatically Assigned</span>
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

const OrderDetailsModal = ({ isOpen, onClose, statusComparison = { currentMonth: {}, previousMonth: {} }, amountTotals = { today: 0, currentMonth: 0 }, onMonthChange, onYearChange, selectedMonth, selectedYear }) => {
  if (!isOpen) return null;

  const { theme } = useTheme();

  console.log("OrderDetailsModal - statusComparison:", statusComparison);
  console.log("OrderDetailsModal - amountTotals:", amountTotals);

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
              <span className="text-gray-600 dark:text-gray-300 text-xs">Today's Total Amount</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(amountTotals.today || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">Current Month Total</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(amountTotals.currentMonth || 0).toFixed(2)}</span>
            </div>
            {selectedMonth && (
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Month Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(amountTotals.selectedMonth || 0).toFixed(2)}</span>
              </div>
            )}
            {selectedYear && (
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Selected Year Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(amountTotals.selectedYear || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Order Status Comparison</h4>
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
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [totalClients, setTotalClients] = useState(0);
  const [countbystatus, setCountbystatus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "" });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [confirmUserId, setConfirmUserId] = useState("");
  const [confirmUserName, setConfirmUserName] = useState("");
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [showLeadDetailsModal, setShowLeadDetailsModal] = useState(false);
  const [leadCreationCounts, setLeadCreationCounts] = useState({ createdByUser: 0, assignedAutomatically: 0 });
  const [statusComparison, setStatusComparison] = useState({ currentMonth: {}, previousMonth: {} });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [orderStatusComparison, setOrderStatusComparison] = useState({ currentMonth: {}, previousMonth: {} });
  const [orderAmountTotals, setOrderAmountTotals] = useState({ today: 0, currentMonth: 0 });

  const statusIcons = {
    Available: (
      <div className="group relative flex items-center space-x-1 px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
        <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400" />
        <span>Available</span>
        <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2">
          Available
        </span>
      </div>
    ),
    OnBreak: (
      <div className="group relative flex items-center space-x-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
        <Coffee className="w-3 h-3 text-blue-500 dark:text-blue-400" />
        <span>On Break</span>
        <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2">
          On Break
        </span>
      </div>
    ),
    Lunch: (
      <div className="group relative flex items-center space-x-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 rounded-full text-xs font-medium">
        <Utensils className="w-3 h-3 text-orange-500 dark:text-orange-400" />
        <span>Lunch</span>
        <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2">
          Lunch
        </span>
      </div>
    ),
    Meeting: (
      <div className="group relative flex items-center space-x-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
        <Calendar className="w-3 h-3 text-purple-500 dark:text-purple-400" />
        <span>Meeting</span>
        <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2">
          Meeting
        </span>
      </div>
    ),
    LoggedOut: (
      <div className="group relative flex items-center space-x-1 px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
        <LogOut className="w-3 h-3 text-red-500 dark:text-red-400" />
        <span>Logged Out</span>
        <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 text-xs rounded py-1 px-2 -top-8 left-1/2 -translate-x-1/2">
          Logged Out
        </span>
      </div>
    ),
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
    currentMonth: status === "TotalOrders" ? calculateTotal(orderStatusComparison.currentMonth) : orderStatusComparison.currentMonth?.[status] || 0,
    previousMonth: status === "TotalOrders" ? calculateTotal(orderStatusComparison.previousMonth) : orderStatusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && orderStatusComparison.selectedMonth ? { selectedMonth: status === "TotalOrders" ? calculateTotal(orderStatusComparison.selectedMonth) : orderStatusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && orderStatusComparison.selectedYear ? { selectedYear: status === "TotalOrders" ? calculateTotal(orderStatusComparison.selectedYear) : orderStatusComparison.selectedYear[status] || 0 } : {}),
  }));

  useEffect(() => {
    const verifyRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/Auth/check", {
          method: "GET",
          credentials: "include",
        });
  
        if (!res.ok) {
          throw new Error("Not authorized");
        }
        const data = await res.json();
        if (data.user.role === "sales") {
          navigate("/home/salesdashboard");
        } else if (data.user.role === "procurement") {
          navigate("/home/procurementdashboard");
        } else if (data.user.role !== "admin") {
          navigate("/home"); // Redirect other roles (e.g., customer_relations) to home
        } else {
          setLoading(false); // Admin stays on this dashboard
        }
      } catch (error) {
        console.error("Role verification failed:", error);
        navigate("/");
      }
    };
  
    verifyRole();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join("&")}` : "";

        const [leadRes, statusRes, ordersRes, usersRes, creationCountsRes, leadStatusComparisonRes, orderStatusComparisonRes, orderAmountTotalsRes] = await Promise.all([
          fetch("http://localhost:3000/Admin/getleadcount", { credentials: "include" }),
          fetch("http://localhost:3000/Admin/getcountbystatus", { credentials: "include" }),
          fetch("http://localhost:3000/Admin/getallorders", { credentials: "include" }),
          fetch("http://localhost:3000/Admin/getmyteam", { credentials: "include" }),
          fetch("http://localhost:3000/Admin/getLeadCreationCounts", { credentials: "include" }),
          fetch(`http://localhost:3000/Admin/getLeadStatusComparison${queryString}`, { credentials: "include" }),
          fetch(`http://localhost:3000/Admin/getOrderStatusComparison${queryString}`, { credentials: "include" }),
          fetch(`http://localhost:3000/Admin/getOrderAmountTotals${queryString}`, { credentials: "include" }),
        ]);

        const errors = [];
        if (!leadRes.ok) errors.push(`Failed to fetch lead count: ${leadRes.status}`);
        if (!statusRes.ok) errors.push(`Failed to fetch status counts: ${statusRes.status}`);
        if (!ordersRes.ok) errors.push(`Failed to fetch orders: ${ordersRes.status}`);
        if (!usersRes.ok) errors.push(`Failed to fetch team users: ${usersRes.status}`);
        if (!creationCountsRes.ok) errors.push(`Failed to fetch lead creation counts: ${creationCountsRes.status}`);
        if (!leadStatusComparisonRes.ok) errors.push(`Failed to fetch lead status comparison: ${leadStatusComparisonRes.status}`);
        if (!orderStatusComparisonRes.ok) errors.push(`Failed to fetch order status comparison: ${orderStatusComparisonRes.status}`);
        if (!orderAmountTotalsRes.ok) errors.push(`Failed to fetch order amount totals: ${orderAmountTotalsRes.status}`);

        if (errors.length) {
          console.error("Fetch errors:", errors);
          errors.forEach(error => toast.error(error));
          return;
        }

        const leadData = await leadRes.json();
        const statusData = await statusRes.json();
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        const creationCountsData = await creationCountsRes.json();
        const leadStatusComparisonData = await leadStatusComparisonRes.json();
        const orderStatusComparisonData = await orderStatusComparisonRes.json();
        const orderAmountTotalsData = await orderAmountTotalsRes.json();

        console.log("Fetched data:", {
          leadData,
          statusData,
          ordersData,
          usersData,
          creationCountsData,
          leadStatusComparisonData,
          orderStatusComparisonData,
          orderAmountTotalsData,
        });

        setTotalClients(leadData.leadcount || 0);
        setCountbystatus(statusData || []);
        setOrders(ordersData || []);
        setTeamUsers(usersData || []);
        setLeadCreationCounts({
          createdByUser: creationCountsData.createdByUser || 0,
          assignedAutomatically: creationCountsData.assignedAutomatically || 0,
        });
        setStatusComparison(leadStatusComparisonData || { currentMonth: {}, previousMonth: {} });
        setOrderStatusComparison(orderStatusComparisonData || { currentMonth: {}, previousMonth: {} });
        setOrderAmountTotals(orderAmountTotalsData || { today: 0, currentMonth: 0 });
      } catch (error) {
        console.error("Fetch data error:", error);
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const getStatusCount = (status) => {
    const statusObj = countbystatus.find((item) => item._id === status);
    return statusObj ? statusObj.count : 0;
  };

  const handleAddUser = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("All fields are required");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/Auth/Createuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMember),
      });
      if (res.status === 403) {
        toast.error("Access denied, contact admin");
        return;
      }
      if (res.status === 409) {
        toast.error("User with email already exists");
        return;
      }
      if (!res.ok) {
        toast.error("Failed to add user");
        return;
      }
      const savedUser = await res.json();
      setTeamUsers((prev) => [...prev, savedUser]);
      setShowModal(false);
      setNewMember({ name: "", email: "", role: "" });
      toast.success("User added to the team!");
    } catch (error) {
      console.error("Add user error:", error);
      toast.error("Error adding user");
    }
  };

  const handleUserAction = async (action, userId) => {
    console.log(`Performing action: ${action} for userId: ${userId}`);
    try {
      if (action === "Pause" || action === "Resume") {
        const status = action === "Pause";
        const res = await fetch(
          `http://localhost:3000/User/Pauseandresume/${userId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status }),
          }
        );

        if (res.status === 403) {
          toast.error("Access denied, contact admin");
          return;
        }
        if (res.status === 204) {
          toast.info(`User is already ${action.toLowerCase()}d`);
          return;
        }
        if (res.status === 400) {
          toast.error("Invalid status selected");
          return;
        }
        if (!res.ok) {
          toast.error("Failed to change status");
          return;
        }

        setTeamUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isPaused: status } : user
          )
        );
        toast.success(`User ${action.toLowerCase()}d successfully`);
      } else if (action === "Reassign Leads") {
        const res = await fetch(
          `http://localhost:3000/User/Reassign/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to reassign leads");
          return;
        }

        toast.success(data.message);
      } else if (action === "Change Role") {
        const user = teamUsers.find((user) => user._id === userId);
        if (user) {
          setSelectedUserId(userId);
          setCurrentRole(user.role);
          setShowRoleModal(true);
        }
      } else if (action === "Password") {
        setSelectedUserId(userId);
        setShowPasswordModal(true);
      } else if (action === "Grant Access" || action === "Revoke Access") {
        setIsAccessLoading(true);
        const newAccess = action === "Grant Access";
        const res = await fetch(
          `http://localhost:3000/User/${userId}/access`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ access: newAccess }),
          }
        );

        const data = await res.json();
        if (res.status === 403) {
          toast.error("Access denied, admin access required");
          return;
        }
        if (res.status === 404) {
          toast.error("User not found");
          return;
        }
        if (res.status === 400) {
          toast.error("Invalid input");
          return;
        }
        if (!res.ok) {
          toast.error(`Failed to ${newAccess ? "grant" : "revoke"} access: ${data.message || "Unknown error"}`);
          return;
        }

        setTeamUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, Access: newAccess } : user
          )
        );
        toast.success(`Access ${newAccess ? "granted" : "revoked"} successfully`);
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast.error(`Failed to perform action: ${action}`);
    } finally {
      setIsAccessLoading(false);
    }
  };

  const showConfirmation = (action, userId, userName) => {
    setConfirmAction(action);
    setConfirmUserId(userId);
    setConfirmUserName(userName);
    setShowConfirmModal(true);
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
      <div className="flex flex-wrap gap-6 p-3 px-6 sm:px-20">
        {["Ordered", "Quoted"].map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
              if (status === "Ordered") {
                setShowOrderDetailsModal(true);
              }
            }}
          >
            <h3 className="text-gray-500 dark:text-gray-300 text-lg">{status}</h3>
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {getStatusCount(status)}
            </span>
          </div>
        ))}
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => setShowLeadDetailsModal(true)}
        >
          <h3 className="text-gray-500 dark:text-gray-300 text-lg">Total Clients</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {totalClients}
          </span>
        </div>
        <div
          className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4"
        >
          <h3 className="text-gray-500 dark:text-gray-300 text-lg">Today's Total Amount</h3>
          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            ${orderAmountTotals.today.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Order Status Comparison</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month to Compare</option>
                {(() => {
                  const options = [];
                  const now = new Date();
                  for (let i = 0; i < 12; i++) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    const label = date.toLocaleString("default", { month: "long", year: "numeric" });
                    options.push({ value, label });
                  }
                  return options;
                })().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedYear || ""}
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

        <div className="w-full sm:max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow p-4 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Team</h3>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {teamUsers.map((member) => (
              <li
                key={member._id}
                className="relative flex items-center justify-between space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 text-white rounded-full flex items-center justify-center font-semibold ${
                      member.isPaused ? "bg-red-500 dark:bg-red-600" : "bg-blue-500 dark:bg-blue-600"
                    }`}
                  >
                    {member.role[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{member.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {member.role.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{member.email}</span>
                    <span className={`text-xs ${member.Access ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {member.Access ? "Access Granted" : "No Access"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="absolute top-2 right-12">
                    {statusIcons[member.status] || <span className="text-xs text-gray-500 dark:text-gray-400">Unknown</span>}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === member._id ? null : member._id)
                      }
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-gray-100" />
                    </button>
                    {dropdownOpen === member._id && (
                      <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            showConfirmation(
                              member.isPaused ? "Resume" : "Pause",
                              member._id,
                              member.name
                            );
                            setDropdownOpen(null);
                          }}
                        >
                          {member.isPaused ? "Resume" : "Pause"}
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            showConfirmation("Reassign Leads", member._id, member.name);
                            setDropdownOpen(null);
                          }}
                        >
                          Reassign Leads
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            showConfirmation("Change Role", member._id, member.name);
                            setDropdownOpen(null);
                          }}
                        >
                          Change Role
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            showConfirmation("Password", member._id, member.name);
                            setDropdownOpen(null);
                          }}
                        >
                          Password
                        </button>
                        <button
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            isAccessLoading
                              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => {
                            if (!isAccessLoading) {
                              showConfirmation(
                                member.Access ? "Revoke Access" : "Grant Access",
                                member._id,
                                member.name
                              );
                              setDropdownOpen(null);
                            }
                          }}
                          disabled={isAccessLoading}
                        >
                          {isAccessLoading
                            ? "Processing..."
                            : member.Access
                            ? "Revoke Access"
                            : "Grant Access"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-xs"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Change Password</h3>
              <div className="space-y-3">
                <input
                  type="password"
                  className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  placeholder="New Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordInput("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `http://localhost:3000/User/Resetpassword/${selectedUserId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              newpassword: passwordInput,
                            }),
                          }
                        );
                        if (res.status === 403) {
                          toast.error("Only admin can change password");
                          return;
                        }
                        if (res.status === 400) {
                          toast.error("Password cannot be empty");
                          return;
                        }
                        if (res.status === 404) {
                          toast.error("User doesn’t exist, please check the database");
                          return;
                        }
                        if (!res.ok) {
                          toast.error("An error occurred");
                          return;
                        }
                        toast.success("Password updated successfully!");
                        setShowPasswordModal(false);
                        setPasswordInput("");
                      } catch (err) {
                        console.error("Password reset error:", err);
                        toast.error("Failed to change password");
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-xs"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Add Team Member</h3>
              <div className="space-y-3">
                <input
                  className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  placeholder="Name"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                />
                <input
                  className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                />
                <select
                  className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="customer_relations">Customer Relations</option>
                  <option value="procurement">Procurement</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700"
                    onClick={handleAddUser}
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showRoleModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-xs"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Change User Role</h3>
              <div className="space-y-3">
                <select
                  className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="" disabled>
                    Select New Role
                  </option>
                  <option value="admin" disabled={currentRole === "admin"}>
                    Admin
                  </option>
                  <option value="sales" disabled={currentRole === "sales"}>
                    Sales
                  </option>
                  <option
                    value="customer_relations"
                    disabled={currentRole === "customer_relations"}
                  >
                    Customer Relations
                  </option>
                  <option
                    value="procurement"
                    disabled={currentRole === "procurement"}
                  >
                    Procurement
                  </option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedRole("");
                      setCurrentRole("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700"
                    onClick={async () => {
                      if (!selectedRole) {
                        toast.error("Please select a role");
                        return;
                      }
                      try {
                        const res = await fetch(
                          `http://localhost:3000/User/Changerole/${selectedUserId}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ newrole: selectedRole }),
                          }
                        );

                        const data = await res.json();
                        if (res.status === 403) {
                          toast.error("Access denied, contact admin");
                          return;
                        }
                        if (res.status === 404) {
                          toast.error("User not found");
                          return;
                        }
                        if (res.status === 204) {
                          toast.info("User is already assigned this role");
                          return;
                        }
                        if (!res.ok) {
                          toast.error(data.message || "Failed to change role");
                          return;
                        }

                        setTeamUsers((prevUsers) =>
                          prevUsers.map((user) =>
                            user._id === selectedUserId
                              ? { ...user, role: selectedRole }
                              : user
                          )
                        );

                        toast.success("User role changed successfully!");
                        setShowRoleModal(false);
                        setSelectedRole("");
                        setCurrentRole("");
                      } catch (err) {
                        console.error("Role change error:", err);
                        toast.error("Failed to change role");
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showConfirmModal && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onConfirm={() => {
              handleUserAction(confirmAction, confirmUserId);
              setShowConfirmModal(false);
            }}
            onCancel={() => setShowConfirmModal(false)}
            action={confirmAction}
            userName={confirmUserName}
          />
        )}
        {showLeadDetailsModal && (
          <LeadDetailsModal
            isOpen={showLeadDetailsModal}
            onClose={() => setShowLeadDetailsModal(false)}
            createdByUser={leadCreationCounts.createdByUser}
            assignedAutomatically={leadCreationCounts.assignedAutomatically}
            statusComparison={statusComparison}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}
        {showOrderDetailsModal && orderAmountTotals && orderStatusComparison && (
          <OrderDetailsModal
            isOpen={showOrderDetailsModal}
            onClose={() => setShowOrderDetailsModal(false)}
            statusComparison={orderStatusComparison}
            amountTotals={orderAmountTotals}
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

export default Dashboard;