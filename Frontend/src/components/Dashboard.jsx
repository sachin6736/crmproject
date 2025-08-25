import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Plus,
  MoreVertical,
  CheckCircle,
  Coffee,
  Utensils,
  Calendar,
  LogOut,
  DollarSign,
  TrendingUp,
  Users,
  Send,
  Truck,
  BarChart2,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { createPortal } from 'react-dom';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmationModal from "./ConfirmationModal";


  

const LeadDetailsModal = ({
  isOpen,
  onClose,
  createdByUser,
  assignedAutomatically,
  statusComparison: initialStatusComparison,
}) => {
  if (!isOpen) return null;

  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [statusComparison, setStatusComparison] = useState(
    initialStatusComparison || {
      currentMonth: {},
      previousMonth: {},
      currentYear: {},
    }
  );
  const [leadCounts, setLeadCounts] = useState({
    today: 0,
    currentMonth: 0,
    currentYear: 0,
  });
  const [conversionRates, setConversionRates] = useState({
    currentMonth: { converted: 0, total: 0, rate: 0 },
    currentYear: { converted: 0, total: 0, rate: 0 },
    selectedMonth: { converted: 0, total: 0, rate: 0 },
    selectedYear: { converted: 0, total: 0, rate: 0 },
  });
  const [comparisonText, setComparisonText] = useState({
    totalLeads: "",
    conversionRate: "",
    totalLeadsMeta: { direction: "", percentage: 0, difference: 0 },
    conversionRateMeta: { direction: "", percentage: 0 },
  });

  const statusColors = {
    Quoted:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    NoResponse: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    WrongNumber: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    NotInterested:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    PriceTooHigh:
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    PartNotAvailable:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Ordered:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    TotalLeads: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const lineColors = {
    currentMonth: "#8884d8",
    previousMonth: "#82ca9d",
    currentYear: "#00bcd4",
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

  const calculateTotalLeadsComparison = (
    current,
    selected,
    period,
    isYear = false
  ) => {
    const currentValue = calculateTotal(current);
    const selectedValue = calculateTotal(selected);
    if (selectedValue === 0)
      return { direction: "", percentage: 0, difference: 0, text: "" };
    const difference = currentValue - selectedValue;
    const percentage = ((difference / selectedValue) * 100).toFixed(2);
    const direction = difference >= 0 ? "increased" : "decreased";
    const absDifference = Math.abs(difference);
    const comparePeriod = isYear ? "current year" : "current month";
    return {
      direction,
      percentage: Math.abs(percentage),
      difference: absDifference,
      text: `Total leads ${direction} by ${Math.abs(
        percentage
      )}% (${absDifference}) compared to selected ${period}. Selected ${period} total leads = ${selectedValue}, ${comparePeriod} total leads = ${currentValue}`,
    };
  };

  const calculateConversionComparison = (
    current,
    selected,
    period,
    isYear = false
  ) => {
    if (selected.total === 0 || current.total === 0)
      return { direction: "", percentage: 0, text: "" };
    const currentRate = current.rate;
    const selectedRate = selected.rate;
    const difference = currentRate - selectedRate;
    const percentage =
      selectedRate !== 0 ? ((difference / selectedRate) * 100).toFixed(2) : 0;
    const direction = difference >= 0 ? "increased" : "decreased";
    const comparePeriod = isYear ? "current year" : "current month";
    return {
      direction,
      percentage: Math.abs(percentage),
      text: `Conversion rate ${direction} by ${Math.abs(
        percentage
      )}%. Selected ${period} = ${selected.converted} out of ${
        selected.total
      } leads converted to sales (${selectedRate.toFixed(
        2
      )}% conversion rate). ${
        comparePeriod.charAt(0).toUpperCase() + comparePeriod.slice(1)
      } = ${current.converted} out of ${
        current.total
      } leads converted to sales (${currentRate.toFixed(2)}% conversion rate)`,
    };
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true); // Set loading to true
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join("&")}` : "";
        const res = await fetch(
          `${import.meta.env.vite_api_url}/Admin/getLeadCountsAndConversions${queryString}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok)
          throw new Error("Failed to fetch lead counts and conversions");
        const data = await res.json();
        setStatusComparison(
          data.statusComparison || {
            currentMonth: {},
            previousMonth: {},
            currentYear: {},
          }
        );
        setLeadCounts({
          today: data.leadCounts.today || 0,
          currentMonth: data.leadCounts.currentMonth || 0,
          currentYear: data.leadCounts.currentYear || 0,
          ...(selectedMonth && {
            selectedMonth: data.leadCounts.selectedMonth || 0,
          }),
          ...(selectedYear && {
            selectedYear: data.leadCounts.selectedYear || 0,
          }),
        });
        setConversionRates({
          currentMonth: data.conversionRates?.currentMonth || {
            converted: 0,
            total: 0,
            rate: 0,
          },
          currentYear: data.conversionRates?.currentYear || {
            converted: 0,
            total: 0,
            rate: 0,
          },
          ...(selectedMonth && {
            selectedMonth: data.conversionRates?.selectedMonth || {
              converted: 0,
              total: 0,
              rate: 0,
            },
          }),
          ...(selectedYear && {
            selectedYear: data.conversionRates?.selectedYear || {
              converted: 0,
              total: 0,
              rate: 0,
            },
          }),
        });
  
        // Calculate comparison text
        let totalLeadsText = {
          direction: "",
          percentage: 0,
          difference: 0,
          text: "",
        };
        let conversionText = { direction: "", percentage: 0, text: "" };
        if (selectedMonth) {
          totalLeadsText = calculateTotalLeadsComparison(
            data.statusComparison.currentMonth,
            data.statusComparison.selectedMonth,
            "month"
          );
          conversionText = calculateConversionComparison(
            data.conversionRates.currentMonth,
            data.conversionRates.selectedMonth,
            "month"
          );
        } else if (selectedYear) {
          totalLeadsText = calculateTotalLeadsComparison(
            data.statusComparison.currentYear,
            data.statusComparison.selectedYear,
            "year",
            true
          );
          conversionText = calculateConversionComparison(
            data.conversionRates.currentYear,
            data.conversionRates.selectedYear,
            "year",
            true
          );
        }
        setComparisonText({
          totalLeads: totalLeadsText.text,
          conversionRate: conversionText.text,
          totalLeadsMeta: {
            direction: totalLeadsText.direction,
            percentage: totalLeadsText.percentage,
            difference: totalLeadsText.difference,
          },
          conversionRateMeta: {
            direction: conversionText.direction,
            percentage: conversionText.percentage,
          },
        });
      } catch (error) {
        console.error("Error fetching lead counts and conversions:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };
  
    fetchComparisonData();
  }, [selectedMonth, selectedYear]);

  const chartData = statuses.map((status) => ({
    status: status === "TotalLeads" ? "Total Leads" : status,
    currentMonth:
      status === "TotalLeads"
        ? calculateTotal(statusComparison.currentMonth)
        : statusComparison.currentMonth?.[status] || 0,
    previousMonth:
      status === "TotalLeads"
        ? calculateTotal(statusComparison.previousMonth)
        : statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth
      ? {
          selectedMonth:
            status === "TotalLeads"
              ? calculateTotal(statusComparison.selectedMonth)
              : statusComparison.selectedMonth[status] || 0,
        }
      : {}),
    ...(selectedYear && statusComparison.selectedYear
      ? {
          selectedYear:
            status === "TotalLeads"
              ? calculateTotal(statusComparison.selectedYear)
              : statusComparison.selectedYear[status] || 0,
        }
      : {}),
  }));

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
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
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <LoadingOverlay isLoading={isLoading} />
      <div className={`${isLoading ? "blur-[1px]" : ""}`}>
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Lead Details
        </h3>
        <div className="space-y-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Leads Created by Users
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {createdByUser}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Leads Automatically Assigned
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {assignedAutomatically}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Today's Lead Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {leadCounts.today}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Month Lead Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {leadCounts.currentMonth}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Year Lead Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {leadCounts.currentYear}
              </span>
            </div>
            {selectedMonth && (
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-xs">
                  Selected Month Lead Count
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {leadCounts.selectedMonth || 0}
                </span>
              </div>
            )}
            {selectedYear && (
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-xs">
                  Selected Year Lead Count
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {leadCounts.selectedYear || 0}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Lead Status Comparison
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedYear(""); // Reset year when month is selected
                }}
              >
                <option value="">Select Month to Compare</option>
                {generateMonthOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(""); // Reset month when year is selected
                }}
              >
                <option value="">Select Year to Compare</option>
                {generateYearOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {(comparisonText.totalLeads || comparisonText.conversionRate) && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                {comparisonText.totalLeads && (
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      {comparisonText.totalLeadsMeta.direction ===
                      "increased" ? (
                        <ArrowUpIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Total Leads Comparison
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {comparisonText.totalLeadsMeta.direction ===
                        "increased" ? (
                          <span>
                            Total leads{" "}
                            <span className="font-bold text-green-600 dark:text-green-400">
                              increased
                            </span>{" "}
                            by{" "}
                            <span className="font-bold">
                              {comparisonText.totalLeadsMeta.percentage}%
                            </span>{" "}
                            ({comparisonText.totalLeadsMeta.difference} leads).
                          </span>
                        ) : (
                          <span>
                            Total leads{" "}
                            <span className="font-bold text-red-600 dark:text-red-400">
                              decreased
                            </span>{" "}
                            by{" "}
                            <span className="font-bold">
                              {comparisonText.totalLeadsMeta.percentage}%
                            </span>{" "}
                            ({comparisonText.totalLeadsMeta.difference} leads).
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {comparisonText.totalLeads.split(". ")[1]}
                      </p>
                    </div>
                  </div>
                )}
                {comparisonText.conversionRate && (
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      {comparisonText.conversionRateMeta.direction ===
                      "increased" ? (
                        <ArrowUpIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Conversion Rate Comparison
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {comparisonText.conversionRateMeta.direction ===
                        "increased" ? (
                          <span>
                            Conversion rate{" "}
                            <span className="font-bold text-green-600 dark:text-green-400">
                              increased
                            </span>{" "}
                            by{" "}
                            <span className="font-bold">
                              {comparisonText.conversionRateMeta.percentage}%
                            </span>
                            .
                          </span>
                        ) : (
                          <span>
                            Conversion rate{" "}
                            <span className="font-bold text-red-600 dark:text-red-400">
                              decreased
                            </span>{" "}
                            by{" "}
                            <span className="font-bold">
                              {comparisonText.conversionRateMeta.percentage}%
                            </span>
                            .
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {comparisonText.conversionRate.split(". ")[1]}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {comparisonText.conversionRate.split(". ")[2]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === "dark" ? "#4B5563" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="status"
                  stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${
                      theme === "dark" ? "#4B5563" : "#E5E7EB"
                    }`,
                    color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="currentMonth"
                  stroke={lineColors.currentMonth}
                  name="Current Month"
                />
                <Line
                  type="monotone"
                  dataKey="previousMonth"
                  stroke={lineColors.previousMonth}
                  name="Previous Month"
                />
                {selectedMonth && (
                  <Line
                    type="monotone"
                    dataKey="selectedMonth"
                    stroke={lineColors.selectedMonth}
                    name="Selected Month"
                  />
                )}
                {selectedYear && (
                  <Line
                    type="monotone"
                    dataKey="selectedYear"
                    stroke={lineColors.selectedYear}
                    name="Selected Year"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statuses.map((status) => (
                <div
                  key={status}
                  className={`p-2 rounded-lg text-center ${
                    statusColors[status.replace(" ", "")]
                  }`}
                >
                  <span className="text-xs font-medium">
                    {status === "TotalLeads"
                      ? "Total Leads"
                      : status
                          .replace("PriceTooHigh", "Price Too High")
                          .replace("PartNotAvailable", "Part Not Available")
                          .replace("NoResponse", "No Response")}
                  </span>
                  <div className="text-md font-bold">
                    {status === "TotalLeads"
                      ? calculateTotal(statusComparison.currentMonth)
                      : statusComparison.currentMonth?.[status] || 0}
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

const OrderDetailsModal = ({
  isOpen,
  onClose,
  statusComparison: initialStatusComparison,
  amountTotals: initialAmountTotals,
}) => {
  if (!isOpen) return null;

  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [statusComparison, setStatusComparison] = useState(
    initialStatusComparison || {
      currentMonth: {},
      previousMonth: {},
      currentYear: {},
    }
  );
  const [amountTotals, setAmountTotals] = useState(
    initialAmountTotals || { today: 0, currentMonth: 0, currentYear: 0 }
  );
  const [orderCounts, setOrderCounts] = useState({
    today: 0,
    currentMonth: 0,
    currentYear: 0,
  });
  const [comparisonText, setComparisonText] = useState("");
  const [comparisonMeta, setComparisonMeta] = useState({
    direction: "",
    percentage: 0,
    difference: 0,
  });

  const statusColors = {
    LocatePending:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    POPending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    POSent:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    POConfirmed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    VendorPaymentPending:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    VendorPaymentConfirmed:
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    ShippingPending:
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    ShipOut:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    Intransit: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    Delivered: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
    Replacement: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Litigation: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    ReplacementCancelled:
      "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    TotalOrders:
      "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
  };

  const lineColors = {
    currentMonth: "#8884d8",
    previousMonth: "#82ca9d",
    selectedMonth: "#ff7300",
    selectedYear: "#d81b60",
    currentYear: "#00b7eb", // Added for current year line in chart
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

  const calculateComparison = (current, selected, period) => {
    const selectedValue = calculateTotal(selected);
    if (selectedValue === 0) {
      return {
        direction: "",
        percentage: 0,
        difference: 0,
        text: `No data available for the selected ${period}.`,
      };
    }
    const currentValue = calculateTotal(current);
    const difference = currentValue - selectedValue;
    const percentage =
      selectedValue !== 0 ? ((difference / selectedValue) * 100).toFixed(2) : 0;
    const direction = difference >= 0 ? "increased" : "decreased";
    const absDifference = Math.abs(difference);
    const comparePeriod = period === "year" ? "current year" : "current month";
    return {
      direction,
      percentage: Math.abs(percentage),
      difference: absDifference,
      text: `Total orders ${direction} by ${Math.abs(
        percentage
      )}% (${absDifference}) compared to selected ${period}. Selected ${period} total orders = ${selectedValue}, ${comparePeriod} total orders = ${currentValue}`,
    };
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true); // Set loading to true
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join("&")}` : "";
        const [statusRes, amountRes, countsRes] = await Promise.all([
          fetch(
            `${import.meta.env.vite_api_url}/Admin/getOrderStatusComparison${queryString}`,
            { credentials: "include" }
          ),
          fetch(
            `${import.meta.env.vite_api_url}/Admin/getOrderAmountTotals${queryString}`,
            { credentials: "include" }
          ),
          fetch(`${import.meta.env.vite_api_url}/Admin/getOrderCounts${queryString}`, {
            credentials: "include",
          }),
        ]);
        if (!statusRes.ok || !amountRes.ok || !countsRes.ok) {
          throw new Error("Failed to fetch order data");
        }
        const [statusData, amountData, countsData] = await Promise.all([
          statusRes.json(),
          amountRes.json(),
          countsRes.json(),
        ]);
        setStatusComparison(statusData);
        setAmountTotals(amountData);
        setOrderCounts(countsData);
  
        // Calculate comparison text
        const comparison = selectedMonth
          ? calculateComparison(
              statusData.currentMonth,
              statusData.selectedMonth,
              "month"
            )
          : selectedYear
          ? calculateComparison(
              statusData.currentYear,
              statusData.selectedYear,
              "year"
            )
          : { direction: "", percentage: 0, difference: 0, text: "" };
        setComparisonText(comparison.text);
        setComparisonMeta({
          direction: comparison.direction,
          percentage: comparison.percentage,
          difference: comparison.difference,
        });
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };
  
    fetchComparisonData();
  }, [selectedMonth, selectedYear]);
  const chartData = statuses.map((status) => ({
    status:
      status === "TotalOrders"
        ? "Total Orders"
        : status.replace(/([A-Z])/g, " $1").trim(),
    currentMonth:
      status === "TotalOrders"
        ? calculateTotal(statusComparison.currentMonth)
        : statusComparison.currentMonth?.[status] || 0,
    previousMonth:
      status === "TotalOrders"
        ? calculateTotal(statusComparison.previousMonth)
        : statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth
      ? {
          selectedMonth:
            status === "TotalOrders"
              ? calculateTotal(statusComparison.selectedMonth)
              : statusComparison.selectedMonth[status] || 0,
        }
      : {}),
    ...(selectedYear && statusComparison.selectedYear
      ? {
          selectedYear:
            status === "TotalOrders"
              ? calculateTotal(statusComparison.selectedYear)
              : statusComparison.selectedYear[status] || 0,
        }
      : {}),
    ...(selectedYear && statusComparison.currentYear
      ? {
          currentYear:
            status === "TotalOrders"
              ? calculateTotal(statusComparison.currentYear)
              : statusComparison.currentYear[status] || 0,
        }
      : {}),
  }));

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
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
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <LoadingOverlay isLoading={isLoading} />
      <div className={`${isLoading ? "blur-[1px]" : ""}`}>
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Order Details
        </h3>
        <div className="space-y-3"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Today's Order Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {orderCounts.today || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Today's Order Amount
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${(amountTotals.today || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Month Order Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {orderCounts.currentMonth || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Month Order Amount
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${(amountTotals.currentMonth || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Year Order Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {orderCounts.currentYear || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Year Order Amount
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${(amountTotals.currentYear || 0).toFixed(2)}
              </span>
            </div>
            {selectedMonth && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Month Order Count
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {orderCounts.selectedMonth || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Month Order Amount
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${(amountTotals.selectedMonth || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {selectedYear && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Year Order Count
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {orderCounts.selectedYear || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Year Order Amount
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${(amountTotals.selectedYear || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          {comparisonText && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {comparisonMeta.direction === "increased" ? (
                    <ArrowUpIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Order Comparison
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {comparisonMeta.direction === "increased" ? (
                      <span>
                        Total orders{" "}
                        <span className="font-bold text-green-600 dark:text-green-400">
                          increased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        ({comparisonMeta.difference}).
                      </span>
                    ) : (
                      <span>
                        Total orders{" "}
                        <span className="font-bold text-red-600 dark:text-red-400">
                          decreased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        ({comparisonMeta.difference}).
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {comparisonText}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Order Status Comparison
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedYear(""); // Reset year when month is selected
                }}
              >
                <option value="">Select Month to Compare</option>
                {generateMonthOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(""); // Reset month when year is selected
                }}
              >
                <option value="">Select Year to Compare</option>
                {generateYearOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === "dark" ? "#4B5563" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="status"
                  stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${
                      theme === "dark" ? "#4B5563" : "#E5E7EB"
                    }`,
                    color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="currentMonth"
                  stroke={lineColors.currentMonth}
                  name="Current Month"
                />
                <Line
                  type="monotone"
                  dataKey="previousMonth"
                  stroke={lineColors.previousMonth}
                  name="Previous Month"
                />
                {selectedMonth && (
                  <Line
                    type="monotone"
                    dataKey="selectedMonth"
                    stroke={lineColors.selectedMonth}
                    name="Selected Month"
                  />
                )}
                {selectedYear && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="selectedYear"
                      stroke={lineColors.selectedYear}
                      name="Selected Year"
                    />
                    <Line
                      type="monotone"
                      dataKey="currentYear"
                      stroke={lineColors.currentYear}
                      name="Current Year"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statuses.map((status) => (
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
                    {status === "TotalOrders"
                      ? calculateTotal(statusComparison.currentMonth)
                      : statusComparison.currentMonth?.[status] || 0}
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

const PoSentDetailsModal = ({
  isOpen,
  onClose,
  poSentCountsAndTotals: initialPoSentCountsAndTotals,
}) => {
  if (!isOpen) return null;

  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [poSentCountsAndTotals, setPoSentCountsAndTotals] = useState(
    initialPoSentCountsAndTotals || {
      today: { count: 0, totalAmount: 0 },
      currentMonth: { count: 0, totalAmount: 0 },
    }
  );
  const [comparisonText, setComparisonText] = useState("");
  const [comparisonMeta, setComparisonMeta] = useState({
    direction: "",
    percentage: 0,
    difference: 0,
  });

  console.log(
    "PoSentDetailsModal - poSentCountsAndTotals:",
    poSentCountsAndTotals
  );

  const calculateComparison = (current, selected, period) => {
    const currentValue = current?.count || 0;
    const selectedValue = selected?.count || 0;
    if (selectedValue === 0)
      return { direction: "", percentage: 0, difference: 0, text: "" };
    const difference = currentValue - selectedValue;
    const percentage = ((difference / selectedValue) * 100).toFixed(2);
    const direction = difference >= 0 ? "increased" : "decreased";
    const absDifference = Math.abs(difference);
    const comparePeriod = period === "year" ? "current year" : "current month";
    return {
      direction,
      percentage: Math.abs(percentage),
      difference: absDifference,
      text: `PO sent count ${direction} by ${Math.abs(
        percentage
      )}% (${absDifference}) compared to selected ${period}. Selected ${period} PO sent count=${selectedValue}, ${comparePeriod} PO sent count=${currentValue}`,
    };
  };
  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true); // Set loading to true
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join("&")}` : "";
        const res = await fetch(
          `${import.meta.env.vite_api_url}/Admin/getPoSentCountsAndTotals${queryString}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch PO sent data");
        const data = await res.json();
        setPoSentCountsAndTotals(data);
  
        // Calculate comparison text
        const comparison = selectedMonth
          ? calculateComparison(data.currentMonth, data.selectedMonth, "month")
          : selectedYear
          ? calculateComparison(data.currentMonth, data.selectedYear, "year")
          : { direction: "", percentage: 0, difference: 0, text: "" };
        setComparisonText(comparison.text);
        setComparisonMeta({
          direction: comparison.direction,
          percentage: comparison.percentage,
          difference: comparison.difference,
        });
      } catch (error) {
        console.error("Error fetching PO sent data:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };
  
    fetchComparisonData();
  }, [selectedMonth, selectedYear]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
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
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <LoadingOverlay isLoading={isLoading} />
      <div className={`${isLoading ? "blur-[1px]" : ""}`}>
        <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
          PO Sent Details
        </h3>
        <div className="space-y-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Today's PO Sent Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {poSentCountsAndTotals.today?.count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Today's PO Sent Total
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${(poSentCountsAndTotals.today?.totalAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Month PO Sent Count
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {poSentCountsAndTotals.currentMonth?.count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                Current Month PO Sent Total
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                $
                {(poSentCountsAndTotals.currentMonth?.totalAmount || 0).toFixed(
                  2
                )}
              </span>
            </div>
            {selectedMonth && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Month PO Sent Count
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {poSentCountsAndTotals.selectedMonth?.count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Month PO Sent Total
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    $
                    {(
                      poSentCountsAndTotals.selectedMonth?.totalAmount || 0
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {selectedYear && (
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Year PO Sent Count
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {poSentCountsAndTotals.selectedYear?.count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                    Selected Year PO Sent Total
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    $
                    {(
                      poSentCountsAndTotals.selectedYear?.totalAmount || 0
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          {comparisonText && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {comparisonMeta.direction === "increased" ? (
                    <ArrowUpIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    PO Sent Comparison
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {comparisonMeta.direction === "increased" ? (
                      <span>
                        PO sent count{" "}
                        <span className="font-bold text-green-600 dark:text-green-400">
                          increased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        ({comparisonMeta.difference}).
                      </span>
                    ) : (
                      <span>
                        PO sent count{" "}
                        <span className="font-bold text-red-600 dark:text-red-400">
                          decreased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        ({comparisonMeta.difference}).
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {comparisonText}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedYear(""); // Reset year when month is selected
              }}
            >
              <option value="">Select Month to Compare</option>
              {generateMonthOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth(""); // Reset month when year is selected
              }}
            >
              <option value="">Select Year to Compare</option>
              {generateYearOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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

const DeliveredDetailsModal = ({
  isOpen,
  onClose,
  deliveredMetrics: initialDeliveredMetrics,
}) => {
  if (!isOpen) return null;

  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [deliveredMetrics, setDeliveredMetrics] = useState(
    initialDeliveredMetrics || {
      today: { count: 0, revenue: 0, profit: 0 },
      currentMonth: { count: 0, revenue: 0, profit: 0 },
    }
  );
  const [comparisonText, setComparisonText] = useState("");
  const [comparisonMeta, setComparisonMeta] = useState({
    direction: "",
    percentage: 0,
    difference: 0,
  });

  console.log("DeliveredDetailsModal - deliveredMetrics:", deliveredMetrics);

  const calculateComparison = (current, selected, period) => {
    const currentValue = current?.profit || 0;
    const selectedValue = selected?.profit || 0;
    if (selectedValue === 0)
      return { direction: "", percentage: 0, difference: 0, text: "" };
    const difference = currentValue - selectedValue;
    const percentage = ((difference / selectedValue) * 100).toFixed(2);
    const direction = difference >= 0 ? "increased" : "decreased";
    const absDifference = Math.abs(difference);
    const comparePeriod = period === "year" ? "current year" : "current month";
    return {
      direction,
      percentage: Math.abs(percentage),
      difference: absDifference,
      text: `Profit ${direction} by ${Math.abs(
        percentage
      )}% ($${absDifference.toFixed(
        2
      )}) compared to selected ${period}. Selected ${period} profit=$${selectedValue.toFixed(
        2
      )}, ${comparePeriod} profit=$${currentValue.toFixed(2)}`,
    };
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true); // Set loading to true
      try {
        const query = [];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = query.length ? `?${query.join("&")}` : "";
        const res = await fetch(
          `${import.meta.env.vite_api_url}/Admin/getDeliveredMetrics${queryString}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch delivered metrics");
        const data = await res.json();
        setDeliveredMetrics(data);
  
        // Calculate comparison text
        const comparison = selectedMonth
          ? calculateComparison(data.currentMonth, data.selectedMonth, "month")
          : selectedYear
          ? calculateComparison(data.currentMonth, data.selectedYear, "year")
          : { direction: "", percentage: 0, difference: 0, text: "" };
        setComparisonText(comparison.text);
        setComparisonMeta({
          direction: comparison.direction,
          percentage: comparison.percentage,
          difference: comparison.difference,
        });
      } catch (error) {
        console.error("Error fetching delivered metrics:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };
  
    fetchComparisonData();
  }, [selectedMonth, selectedYear]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
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

  const periods = [
    { name: "Today", data: deliveredMetrics.today },
    { name: "Current Month", data: deliveredMetrics.currentMonth },
    ...(selectedMonth
      ? [{ name: "Selected Month", data: deliveredMetrics.selectedMonth }]
      : []),
    ...(selectedYear
      ? [{ name: "Selected Year", data: deliveredMetrics.selectedYear }]
      : []),
  ];

  const COLORS = ["#00C49F", "#FF8042"];

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill={fill}
          fontSize={16}
        >
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
        >{`$${value.toFixed(2)}`}</text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
        >
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  return (
    <motion.div
    className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 sm:px-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
    >
      <LoadingOverlay isLoading={isLoading} />
      <div className={`${isLoading ? "blur-[1px]" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Delivered Details
          </h3>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <select
              className="w-full sm:w-1/2 border p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedYear(""); // Reset year when month is selected
              }}
            >
              <option value="">Select Month to Compare</option>
              {generateMonthOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="w-full sm:w-1/2 border p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth(""); // Reset month when year is selected
              }}
            >
              <option value="">Select Year to Compare</option>
              {generateYearOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {comparisonText && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {comparisonMeta.direction === "increased" ? (
                    <ArrowUpIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Profit Comparison
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {comparisonMeta.direction === "increased" ? (
                      <span>
                        Profit{" "}
                        <span className="font-bold text-green-600 dark:text-green-400">
                          increased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        (${comparisonMeta.difference.toFixed(2)}).
                      </span>
                    ) : (
                      <span>
                        Profit{" "}
                        <span className="font-bold text-red-600 dark:text-red-400">
                          decreased
                        </span>{" "}
                        by{" "}
                        <span className="font-bold">
                          {comparisonMeta.percentage}%
                        </span>{" "}
                        (${comparisonMeta.difference.toFixed(2)}).
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {comparisonText}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {periods.map((period, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  {period.name}
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Count:{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {period.data?.count || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Revenue:{" "}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${(period.data?.revenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Profit:{" "}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    ${(period.data?.profit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Revenue vs Profit Comparison
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {periods.map((period, index) => {
                const pieData = [
                  { name: "Revenue", value: period.data?.revenue || 0 },
                  { name: "Profit", value: period.data?.profit || 0 },
                ];

                return (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                      {period.name}
                    </h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          activeIndex={0}
                          activeShape={renderActiveShape}
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [actionLoading, setActionLoading] = useState(false);
  const [totalClients, setTotalClients] = useState(0);
  const [countbystatus, setCountbystatus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnimationReady, setIsAnimationReady] = useState(false); // New state for animation control
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
  const [leadCreationCounts, setLeadCreationCounts] = useState({
    createdByUser: 0,
    assignedAutomatically: 0,
  });
  const [statusComparison, setStatusComparison] = useState({
    currentMonth: {},
    previousMonth: {},
  });
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [orderStatusComparison, setOrderStatusComparison] = useState({
    currentMonth: {},
    previousMonth: {},
  });
  const [orderAmountTotals, setOrderAmountTotals] = useState({
    today: 0,
    currentMonth: 0,
  });
  const [orderCounts, setOrderCounts] = useState({
    today: 0,
    currentMonth: 0,
    currentYear: 0,
  });
  const [poSentCountsAndTotals, setPoSentCountsAndTotals] = useState({
    today: { count: 0, totalAmount: 0 },
    currentMonth: { count: 0, totalAmount: 0 },
  });
  const [showPoSentDetailsModal, setShowPoSentDetailsModal] = useState(false);
  const [deliveredMetrics, setDeliveredMetrics] = useState({
    today: { count: 0, revenue: 0, profit: 0 },
    currentMonth: { count: 0, revenue: 0, profit: 0 },
  });
  const [showDeliveredDetailsModal, setShowDeliveredDetailsModal] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const buttonRefs = useRef({});

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

  const chartData = statuses.map((status) => ({
    status:
      status === "TotalOrders"
        ? "Total Orders"
        : status.replace(/([A-Z])/g, " $1").trim(),
    currentMonth:
      status === "TotalOrders"
        ? calculateTotal(orderStatusComparison.currentMonth)
        : orderStatusComparison.currentMonth?.[status] || 0,
    previousMonth:
      status === "TotalOrders"
        ? calculateTotal(orderStatusComparison.previousMonth)
        : orderStatusComparison.previousMonth?.[status] || 0,
  }));

  const getStatusCount = (status) => {
    const statusObj = countbystatus.find((item) => item._id === status);
    return statusObj ? statusObj.count : 0;
  };

  useEffect(() => {
    // Delay animation until loading is complete
    if (!loading) {
      const timer = setTimeout(() => {
        setIsAnimationReady(true);
      }, 100); // Small delay to ensure loading overlay is gone
      return () => clearTimeout(timer);
    }
  }, [loading]);


  useEffect(() => {
    const verifyRole = async () => {
      try {
        const res = await fetch(`${import.meta.env.vite_api_url}/Auth/check`, {
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
          navigate("/home");
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
        const [
          leadRes,
          statusRes,
          ordersRes,
          usersRes,
          creationCountsRes,
          leadCountsAndConversionsRes,
          orderStatusComparisonRes,
          orderAmountTotalsRes,
          orderCountsRes,
          poSentCountsAndTotalsRes,
          deliveredMetricsRes,
        ] = await Promise.all([
          fetch(`${import.meta.env.vite_api_url}/Admin/getleadcount`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getcountbystatus`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getallorders`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getmyteam`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getLeadCreationCounts`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getLeadCountsAndConversions`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getOrderStatusComparison`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getOrderAmountTotals`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getOrderCounts`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getPoSentCountsAndTotals`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.vite_api_url}/Admin/getDeliveredMetrics`, {
            credentials: "include",
          }),
        ]);

        const errors = [];
        if (!leadRes.ok)
          errors.push(`Failed to fetch lead count: ${leadRes.status}`);
        if (!statusRes.ok)
          errors.push(`Failed to fetch status counts: ${statusRes.status}`);
        if (!ordersRes.ok)
          errors.push(`Failed to fetch orders: ${ordersRes.status}`);
        if (!usersRes.ok)
          errors.push(`Failed to fetch team users: ${usersRes.status}`);
        if (!creationCountsRes.ok)
          errors.push(
            `Failed to fetch lead creation counts: ${creationCountsRes.status}`
          );
        if (!leadCountsAndConversionsRes.ok)
          errors.push(
            `Failed to fetch lead counts and conversions: ${leadCountsAndConversionsRes.status}`
          );
        if (!orderStatusComparisonRes.ok)
          errors.push(
            `Failed to fetch order status comparison: ${orderStatusComparisonRes.status}`
          );
        if (!orderAmountTotalsRes.ok)
          errors.push(
            `Failed to fetch order amount totals: ${orderAmountTotalsRes.status}`
          );
        if (!orderCountsRes.ok)
          errors.push(`Failed to fetch order counts: ${orderCountsRes.status}`);
        if (!poSentCountsAndTotalsRes.ok)
          errors.push(
            `Failed to fetch PO sent counts and totals: ${poSentCountsAndTotalsRes.status}`
          );
        if (!deliveredMetricsRes.ok)
          errors.push(
            `Failed to fetch delivered metrics: ${deliveredMetricsRes.status}`
          );

        if (errors.length) {
          console.error("Fetch errors:", errors);
          errors.forEach((error) => toast.error(error));
          return;
        }

        const leadData = await leadRes.json();
        const statusData = await statusRes.json();
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        const creationCountsData = await creationCountsRes.json();
        const leadCountsAndConversionsData =
          await leadCountsAndConversionsRes.json();
        const orderStatusComparisonData = await orderStatusComparisonRes.json();
        const orderAmountTotalsData = await orderAmountTotalsRes.json();
        const orderCountsData = await orderCountsRes.json();
        const poSentCountsAndTotalsData = await poSentCountsAndTotalsRes.json();
        const deliveredMetricsData = await deliveredMetricsRes.json();

        console.log("Order Status Comparison Data:", orderStatusComparisonData);

        setTotalClients(leadData.leadcount || 0);
        setCountbystatus(statusData || []);
        setOrders(ordersData || []);
        setTeamUsers(usersData || []);
        setOrderCounts({
          today: orderCountsData.today || 0,
          currentMonth: orderCountsData.currentMonth || 0,
          currentYear: orderCountsData.currentYear || 0,
        });
        setTotalOrders(orderCountsData.totalOrders || 0); // Set total orders
        setLeadCreationCounts({
          createdByUser: creationCountsData.createdByUser || 0,
          assignedAutomatically: creationCountsData.assignedAutomatically || 0,
        });
        setStatusComparison(
          leadCountsAndConversionsData.statusComparison || {
            currentMonth: {},
            previousMonth: {},
          }
        );
        setOrderStatusComparison(
          orderStatusComparisonData || { currentMonth: {}, previousMonth: {} }
        );
        setOrderAmountTotals(
          orderAmountTotalsData || { today: 0, currentMonth: 0 }
        );
        setPoSentCountsAndTotals(
          poSentCountsAndTotalsData || {
            today: { count: 0, totalAmount: 0 },
            currentMonth: { count: 0, totalAmount: 0 },
          }
        );
        setDeliveredMetrics(
          deliveredMetricsData || {
            today: { count: 0, revenue: 0, profit: 0 },
            currentMonth: { count: 0, revenue: 0, profit: 0 },
          }
        );
      } catch (error) {
        console.error("Fetch data error:", error);
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddUserWithConfirmation = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("All fields are required");
      return;
    }
    setShowConfirmModal(true);
    setConfirmAction("Create User");
    setConfirmUserName(newMember.name);
  };

  const handleConfirmAction = async () => {
    setActionLoading(true); // Set loading to true
    try {
      if (confirmAction === "Create User") {
        await handleAddUser();
      } else if (confirmAction === "Reassign Leads") {
        const res = await fetch(
          `${import.meta.env.vite_api_url}/User/Reassign/${confirmUserId}`,
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
      } else if (confirmAction === "Password") {
        const res = await fetch(
          `${import.meta.env.vite_api_url}/User/Resetpassword/${selectedUserId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ newpassword: passwordInput }),
          }
        );
  
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to reset password");
          return;
        }
  
        toast.success(data.message || "Password reset successfully");
        setShowPasswordModal(false); // Close the password modal
        setPasswordInput(""); // Clear the password input
      } else if (confirmAction === "Change Role") {
        // Handle role change
        const res = await fetch(
          `${import.meta.env.vite_api_url}/User/Changerole/${selectedUserId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ newrole: selectedRole }),
          }
        );
  
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to change role");
          return;
        }
  
        // Update the teamUsers state with the new role
        setTeamUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUserId ? { ...user, role: selectedRole } : user
          )
        );
        toast.success(data.message || "Role changed successfully");
        setShowRoleModal(false); // Close the role modal
        setSelectedRole(""); // Clear the selected role
      } else {
        await handleUserAction(confirmAction, confirmUserId);
      }
    } catch (error) {
      console.error(`Error performing action ${confirmAction}:`, error);
      toast.error(`Failed to perform action: ${confirmAction}`);
    } finally {
      setShowConfirmModal(false); // Close the confirmation modal
      setActionLoading(false); // Set loading to false
    }
  };

  const handleAddUser = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("All fields are required");
      return;
    }
    setActionLoading(true); // Set loading to true
    try {
      const res = await fetch(`${import.meta.env.vite_api_url}/Auth/Createuser`, {
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
    } finally {
      setActionLoading(false); // Set loading to false
    }
  };

  const handleUserAction = async (action, userId) => {
    setActionLoading(true); // Set loading to true
    try {
      if (action === "Pause" || action === "Resume") {
        const status = action === "Pause";
        const res = await fetch(
          `${import.meta.env.vite_api_url}/User/Pauseandresume/${userId}`,
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
        // Trigger confirmation modal instead of directly reassigning
        const user = teamUsers.find((user) => user._id === userId);
        if (user) {
          showConfirmation("Reassign Leads", userId, user.name);
        }
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
        const res = await fetch(`${import.meta.env.vite_api_url}/User/${userId}/access`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access: newAccess }),
        });
  
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
          toast.error(
            `Failed to ${newAccess ? "grant" : "revoke"} access: ${
              data.message || "Unknown error"
            }`
          );
          return;
        }
  
        setTeamUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, Access: newAccess } : user
          )
        );
        toast.success(
          `Access ${newAccess ? "granted" : "revoked"} successfully`
        );
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast.error(`Failed to perform action: ${action}`);
    } finally {
      setActionLoading(false); // Set loading to false
      setIsAccessLoading(false);
    }
  };

  const showConfirmation = (action, userId, userName) => {
    setConfirmAction(action);
    setConfirmUserId(userId);
    setConfirmUserName(userName);
    setShowConfirmModal(true);
  };

  // Calculate comparison metrics for TotalOrders
  const currentOrders = orderStatusComparison.currentMonth?.TotalOrders || 0;
  const previousOrders = orderStatusComparison.previousMonth?.TotalOrders || 0;
  const orderDifference = Math.abs(currentOrders - previousOrders);
  const percentageChange =
    previousOrders > 0
      ? (((currentOrders - previousOrders) / previousOrders) * 100).toFixed(2)
      : currentOrders > 0
      ? 100
      : 0;

  
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300 p-4 md:p-8">
      <LoadingOverlay isLoading={loading} />
      <div className={`${loading ? "blur-[1px] pointer-events-none" : ""}`}>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <TrendingUp className="w-8 h-8 text-blue-500 animate-pulse" />
            Admin Dashboard
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
            {[
              {
                title: "Ordered",
                value: totalOrders,
                onClick: () => setShowOrderDetailsModal(true),
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
              },
              {
                title: "Quoted",
                value: getStatusCount("Quoted"),
                onClick: null,
                icon: <DollarSign className="w-5 h-5 text-yellow-500" />,
              },
              {
                title: "Total Clients",
                value: totalClients,
                onClick: () => setShowLeadDetailsModal(true),
                icon: <Users className="w-5 h-5 text-blue-500" />,
              },
              {
                title: "Today's Total Amount",
                value: `$${orderAmountTotals.today.toFixed(2)}`,
                onClick: null,
                icon: <DollarSign className="w-5 h-5 text-green-500" />,
              },
              {
                title: "Today's PO Sent",
                value: poSentCountsAndTotals.today?.count || 0,
                onClick: () => setShowPoSentDetailsModal(true),
                icon: <Send className="w-5 h-5 text-orange-500" />,
              },
              {
                title: "Today's PO Sent Total",
                value: `$${(poSentCountsAndTotals.today?.totalAmount || 0).toFixed(2)}`,
                onClick: () => setShowPoSentDetailsModal(true),
                icon: <DollarSign className="w-5 h-5 text-purple-500" />,
              },
              {
                title: "Today's Delivered",
                value: deliveredMetrics.today?.count || 0,
                onClick: () => setShowDeliveredDetailsModal(true),
                icon: <Truck className="w-5 h-5 text-lime-500" />,
              },
            ].map(({ title, value, onClick, icon }, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center text-center transform hover:scale-105"
                onClick={onClick}
                initial={{ opacity: 0, y: isAnimationReady ? 50 : 0 }} // Start off-screen only if animation is ready
                animate={{ opacity: isAnimationReady ? 1 : 0, y: isAnimationReady ? 0 : 0 }} // Animate only if ready
                transition={{ duration: 0.5, delay: isAnimationReady ? index * 0.1 : 0 }} // Delay animation based on index
              >
                <div className="mb-2">{icon}</div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  {title}
                </h3>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Order Status Comparison
            </h3>
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "dark" ? "#4B5563" : "#E5E7EB"}
                  />
                  <XAxis
                    dataKey="status"
                    stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke={theme === "dark" ? "#D1D5DB" : "#4B5563"}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                      border: `1px solid ${theme === "dark" ? "#4B5563" : "#E5E7EB"}`,
                      color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                      fontSize: "12px",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: theme === "dark" ? "#D1D5DB" : "#1F2937",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentMonth"
                    stroke={lineColors.currentMonth}
                    name="Current Month"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previousMonth"
                    stroke={lineColors.previousMonth}
                    name="Previous Month"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <p>
                  Number of orders{" "}
                  {currentOrders > previousOrders ? "increased" : "decreased"}{" "}
                  by {Math.abs(percentageChange)}% ({orderDifference}) compared
                  to previous month. Previous month orders: {previousOrders},
                  Current month orders: {currentOrders}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 relative"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingOverlay isLoading={loading || actionLoading} />
            <div className={`${loading || actionLoading ? "blur-[1px]" : ""}`}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Team Management
              </h3>
              <div className="flex justify-end mb-4">
                <button
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  onClick={() => setShowModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add New Member
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-96">
                {teamUsers.map((user) => (
                  <motion.div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user.email}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcons[user.status] || (
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          Unknown
                        </span>
                      )}
                      <div className="relative">
                        <button
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          onClick={() =>
                            setDropdownOpen(
                              dropdownOpen === user._id ? null : user._id
                            )
                          }
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        {dropdownOpen === user._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-[100] min-w-max">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() =>
                                showConfirmation(
                                  user.isPaused ? "Resume" : "Pause",
                                  user._id,
                                  user.name
                                )
                              }
                            >
                              {user.isPaused ? "Resume" : "Pause"}
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() =>
                                handleUserAction("Reassign Leads", user._id)
                              }
                            >
                              Reassign Leads
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() =>
                                handleUserAction("Change Role", user._id)
                              }
                            >
                              Change Role
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() =>
                                handleUserAction("Password", user._id)
                              }
                            >
                              Reset Password
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() =>
                                showConfirmation(
                                  user.Access ? "Revoke Access" : "Grant Access",
                                  user._id,
                                  user.name
                                )
                              }
                              disabled={actionLoading}
                            >
                              {user.Access ? "Revoke Access" : "Grant Access"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
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
      <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Add New Member
      </h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Name"
          className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
          value={newMember.name}
          onChange={(e) =>
            setNewMember({ ...newMember, name: e.target.value })
          }
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
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
          <option value="">Select Role</option>
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
            className={`px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700 ${
              actionLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleAddUserWithConfirmation}
            disabled={actionLoading}
          >
            {actionLoading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
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
                  <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    Reset Password
                  </h3>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700"
                      onClick={() => {
                        setShowConfirmModal(true);
                        setConfirmAction("Password");
                        setConfirmUserName(
                          teamUsers.find((user) => user._id === selectedUserId)?.name || "User"
                        );
                      }}
                    >
                      Reset
                    </button>
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
      <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Change Role
      </h3>
      <select
        className="w-full border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="">Select New Role</option>
        <option value="admin">Admin</option>
        <option value="sales">Sales</option>
        <option value="customer_relations">Customer Relations</option>
        <option value="procurement">Procurement</option>
      </select>
      <div className="flex justify-end gap-2 mt-3">
        <button
          className="px-3 py-1 border rounded-lg text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowRoleModal(false)}
        >
          Cancel
        </button>
        <button
          className={`px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-600 dark:hover:bg-blue-700 ${
            actionLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (!selectedRole) {
              toast.error("Please select a role");
              return;
            }
            if (selectedRole === currentRole) {
              toast.info("Selected role is the same as current role");
              return;
            }
            setShowConfirmModal(true);
            setConfirmAction("Change Role");
            setConfirmUserName(
              teamUsers.find((user) => user._id === selectedUserId)?.name || "User"
            );
          }}
          disabled={actionLoading}
        >
          {actionLoading ? "Changing..." : "Change"}
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
            <ConfirmationModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handleConfirmAction}
              title={`Confirm ${confirmAction}`}
              message={`Are you sure you want to ${confirmAction.toLowerCase()} for ${confirmUserName}?`}
              confirmText="Confirm"
              cancelText="Cancel"
            />
            <LeadDetailsModal
              isOpen={showLeadDetailsModal}
              onClose={() => setShowLeadDetailsModal(false)}
              createdByUser={leadCreationCounts.createdByUser}
              assignedAutomatically={leadCreationCounts.assignedAutomatically}
              statusComparison={statusComparison}
            />
            <OrderDetailsModal
              isOpen={showOrderDetailsModal}
              onClose={() => setShowOrderDetailsModal(false)}
              statusComparison={orderStatusComparison}
              amountTotals={orderAmountTotals}
            />
            <PoSentDetailsModal
              isOpen={showPoSentDetailsModal}
              onClose={() => setShowPoSentDetailsModal(false)}
              poSentCountsAndTotals={poSentCountsAndTotals}
            />
            <DeliveredDetailsModal
              isOpen={showDeliveredDetailsModal}
              onClose={() => setShowDeliveredDetailsModal(false)}
              deliveredMetrics={deliveredMetrics}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;