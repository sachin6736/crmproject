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
  ];

  const chartData = statuses.map(status => ({
    status,
    currentMonth: statusComparison.currentMonth?.[status] || 0,
    previousMonth: statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth ? { selectedMonth: statusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && statusComparison.selectedYear ? { selectedYear: statusComparison.selectedYear[status] || 0 } : {}),
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
                  <span className="text-xs font-medium">{status.replace("PriceTooHigh", "Price Too High").replace("PartNotAvailable", "Part Not Available").replace("NoResponse", "No Response")}</span>
                  <div className="text-md font-bold">{statusComparison.currentMonth?.[status] || 0}</div>
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

  const statusColor = {
    Quoted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Ordered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

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
        if (data.user.role !== "admin") {
          navigate("/home/salesdashboard");
        } else {
          setLoading(false);
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

        const [leadRes, statusRes, ordersRes, usersRes, creationCountsRes, statusComparisonRes] = await Promise.all([
          fetch("http://localhost:3000/Admin/getleadcount"),
          fetch("http://localhost:3000/Admin/getcountbystatus"),
          fetch("http://localhost:3000/Admin/getallorders"),
          fetch("http://localhost:3000/Admin/getmyteam"),
          fetch("http://localhost:3000/Admin/getLeadCreationCounts"),
          fetch(`http://localhost:3000/Admin/getLeadStatusComparison${queryString}`),
        ]);

        const leadData = await leadRes.json();
        const statusData = await statusRes.json();
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        const creationCountsData = await creationCountsRes.json();
        const statusComparisonData = await statusComparisonRes.json();

        setTotalClients(leadData.leadcount);
        setCountbystatus(statusData);
        setOrders(ordersData);
        setTeamUsers(usersData);
        setLeadCreationCounts({
          createdByUser: creationCountsData.createdByUser,
          assignedAutomatically: creationCountsData.assignedAutomatically,
        });
        setStatusComparison(statusComparisonData);
      } catch (error) {
        toast.error("Error fetching dashboard data");
        console.error("Fetch data error:", error);
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

  const chartData = [
    { month: "Jan", daily: 300, monthly: 2400 },
    { month: "Feb", daily: 500, monthly: 1398 },
    { month: "Mar", daily: 200, monthly: 9800 },
    { month: "Apr", daily: 278, monthly: 3908 },
    { month: "May", daily: 189, monthly: 4800 },
  ];

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
        console.log(`Sending access: ${newAccess} for userId: ${userId}`);
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
        console.log(`Response status: ${res.status}, data:`, data);

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

        setTeamUsers((prevUsers) => {
          const updatedUsers = prevUsers.map((user) =>
            user._id === userId ? { ...user, Access: newAccess } : user
          );
          console.log("Updated teamUsers:", updatedUsers);
          return updatedUsers;
        });
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
            className="flex-1 min-w-[250px] max-w-sm h-40 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col items-center justify-center p-4"
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
      </div>

      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} />
              <YAxis stroke={theme === 'dark' ? '#D1D5DB' : '#4B5563'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                  color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
                }}
              />
              <Legend wrapperStyle={{ color: theme === 'dark' ? '#D1D5DB' : '#1F2937' }} />
              <Line
                type="monotone"
                dataKey="daily"
                stroke="#8884d8"
                name="Daily Sales"
              />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke="#82ca9d"
                name="Monthly Sales"
              />
            </LineChart>
          </ResponsiveContainer>
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
            {teamUsers.map((member, index) => (
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
                      } catch (error) {
                        console.error("Change role error:", error);
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
        <LeadDetailsModal
          isOpen={showLeadDetailsModal}
          onClose={() => {
            setShowLeadDetailsModal(false);
            setSelectedMonth("");
            setSelectedYear("");
          }}
          createdByUser={leadCreationCounts.createdByUser}
          assignedAutomatically={leadCreationCounts.assignedAutomatically}
          statusComparison={statusComparison}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </AnimatePresence>

      <div className="flex flex-wrap gap-6 p-6 sm:px-20">
        <div className="flex-1 min-w-[300px] h-96 bg-white dark:bg-gray-800 rounded-xl shadow"></div>
        <div className="flex-1 min-w-[300px] h-96 bg-white dark:bg-gray-800 rounded-xl shadow"></div>
      </div>

      <div className="w-full px-4 sm:px-20 py-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
            <div className="space-x-2">
              <button className="px-4 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                Filter
              </button>
              <button className="px-4 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                See all
              </button>
            </div>
          </div>

          <table className="min-w-[700px] w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
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
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 text-sm">
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        order.color || "bg-blue-400 dark:bg-blue-600"
                      }`}
                    >
                      {order.email[0]?.toUpperCase()}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{order.email}</div>
                  </td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.partRequested}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-100">{order.date}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        statusColor[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 cursor-pointer" />
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

export default Dashboard;