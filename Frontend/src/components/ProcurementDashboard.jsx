import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Send,
  Truck,
  CheckCircle,
  BarChart2,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import LoadingOverlay from "./LoadingOverlay";
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
import { useTheme } from "../context/ThemeContext";
import ProcurementOrderDetailsModal from "./ProcurementOrderDetailsModal";

const ProcurementDashboard = () => {
  const { theme } = useTheme();
  const [totalOrders, setTotalOrders] = useState(0);
  const [poSentCount, setPoSentCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [poSentTotalAmount, setPoSentTotalAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [poSentOrders, setPoSentOrders] = useState([]);
  const [orderStatusComparison, setOrderStatusComparison] = useState({
    currentMonth: {},
    previousMonth: {},
  });
  const [orderAmountTotals, setOrderAmountTotals] = useState({
    today: 0,
    currentMonth: 0,
  });
  const [deliveredMetrics, setDeliveredMetrics] = useState({
    today: { count: 0, revenue: 0, profit: 0 },
    currentMonth: { count: 0, revenue: 0, profit: 0 },
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState("full");
  const [user, setUser] = useState(null);

  const statusColor = {
    POSent:
      "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    Delivered: "bg-lime-100 dark:bg-lime-900 text-lime-800 dark:text-lime-200",
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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/User/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user info:", err);
        toast.error("Failed to load user data");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    setLoading(true);

    const fetchMainData = async () => {
      try {
        const query = [`procurementPerson=${user._id}`];
        const queryString = `?${query.join("&")}`;

        const [
          ordersRes,
          orderAmountTotalsRes,
          deliveredMetricsRes,
        ] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/Procurement/getProcurementOrders${queryString}`,
            {
              method: "GET",
              credentials: "include",
            }
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/Procurement/getProcurementOrderAmountTotals${queryString}`,
            {
              method: "GET",
              credentials: "include",
            }
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/Procurement/getProcurementDeliveredMetrics${queryString}`,
            {
              method: "GET",
              credentials: "include",
            }
          ),
        ]);

        const errors = [];
        if (!ordersRes.ok)
          errors.push(
            `Failed to fetch procurement orders: ${ordersRes.status}`
          );
        if (!orderAmountTotalsRes.ok)
          errors.push(
            `Failed to fetch order amount totals: ${orderAmountTotalsRes.status}`
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

        const ordersData = await ordersRes.json();
        const orderAmountTotalsData = await orderAmountTotalsRes.json();
        const deliveredMetricsData = await deliveredMetricsRes.json();

        console.log("Fetched main data:", {
          ordersData,
          orderAmountTotalsData,
          deliveredMetricsData,
        });

        const poSentOrdersData = ordersData.filter(
          (order) =>
            order.status === "PO Sent" &&
            order.vendors.some((vendor) => vendor.poStatus === "PO Sent")
        );
        const poSentCountData = poSentOrdersData.length;
        const poSentTotalAmountData = poSentOrdersData.reduce((sum, order) => {
          const poSentVendor = order.vendors.find(
            (vendor) => vendor.poStatus === "PO Sent"
          );
          return sum + (poSentVendor?.totalCost || 0);
        }, 0);

        setTotalOrders(ordersData.length || 0);
        setPoSentCount(poSentCountData);
        setDeliveredCount(deliveredMetricsData.currentMonth.count || 0);
        setPoSentTotalAmount(poSentTotalAmountData);
        setOrders(ordersData || []);
        setPoSentOrders(poSentOrdersData || []);
        setOrderAmountTotals(
          orderAmountTotalsData || { today: 0, currentMonth: 0 }
        );
        setDeliveredMetrics(
          deliveredMetricsData || {
            today: { count: 0, revenue: 0, profit: 0 },
            currentMonth: { count: 0, revenue: 0, profit: 0 },
          }
        );
      } catch (error) {
        console.error("Fetch main data error:", error);
        toast.error(`Error fetching main data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMainData();
  }, [user]);

  useEffect(() => {
    if (!user?._id) return;

    setChartLoading(true);

    const fetchComparisonData = async () => {
      try {
        const query = [`procurementPerson=${user._id}`];
        if (selectedMonth) query.push(`selectedMonth=${selectedMonth}`);
        if (selectedYear) query.push(`selectedYear=${selectedYear}`);
        const queryString = `?${query.join("&")}`;

        const statusComparisonRes = await fetch(
          `${import.meta.env.VITE_API_URL}/Procurement/getProcurementOrderStatusComparison${queryString}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!statusComparisonRes.ok) {
          throw new Error(`Failed to fetch order status comparison: ${statusComparisonRes.status}`);
        }

        const statusComparisonData = await statusComparisonRes.json();

        console.log("Fetched comparison data:", {
          statusComparisonData,
        });

        setOrderStatusComparison(
          statusComparisonData || { currentMonth: {}, previousMonth: {} }
        );
      } catch (error) {
        console.error("Fetch comparison data error:", error);
        toast.error(`Error fetching comparison data: ${error.message}`);
      } finally {
        setChartLoading(false);
      }
    };

    fetchComparisonData();
  }, [user, selectedMonth, selectedYear]);

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <LoadingOverlay isLoading={loading || chartLoading} />
      <div className={`${loading || chartLoading ? "blur-[1px]" : ""}`}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Procurement Dashboard
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {[
              {
                title: "PO Sent",
                value: poSentCount,
                viewMode: "poSent",
                icon: <Send className="w-5 h-5 text-orange-500" />,
              },
              {
                title: "Delivered",
                value: deliveredCount,
                viewMode: "delivered",
                icon: <Truck className="w-5 h-5 text-lime-500" />,
              },
              {
                title: "Total Orders",
                value: totalOrders,
                viewMode: "totalOrders",
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
              },
              {
                title: "Today's Total",
                value: `$${(orderAmountTotals.today || 0).toFixed(2)}`,
                viewMode: "todayTotal",
                icon: <DollarSign className="w-5 h-5 text-blue-500" />,
              },
              {
                title: "PO Sent Total Amount",
                value: `$${(poSentTotalAmount || 0).toFixed(2)}`,
                viewMode: "poSentTotalAmount",
                icon: <DollarSign className="w-5 h-5 text-purple-500" />,
              },
            ].map(({ title, value, viewMode, icon }, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center text-center"
                onClick={() => {
                  setViewMode(viewMode);
                  setShowOrderDetailsModal(true);
                }}
              >
                <div className="mb-2">{icon}</div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  {title}
                </h3>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Order Status Comparison
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <select
                    className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    value={selectedMonth || ""}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={loading || chartLoading}
                  >
                    <option value="">Select Month to Compare</option>
                    {(() => {
                      const options = [];
                      const now = new Date();
                      for (let i = 0; i < 12; i++) {
                        const date = new Date(
                          now.getFullYear(),
                          now.getMonth() - i,
                          1
                        );
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
                    })().map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full sm:w-1/2 border p-1.5 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    value={selectedYear || ""}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={loading || chartLoading}
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
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={statuses.map((status) => ({
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
                      ...(selectedMonth && orderStatusComparison.selectedMonth
                        ? {
                            selectedMonth:
                              status === "TotalOrders"
                                ? calculateTotal(
                                    orderStatusComparison.selectedMonth
                                  )
                                : orderStatusComparison.selectedMonth[status] ||
                                  0,
                          }
                        : {}),
                      ...(selectedYear && orderStatusComparison.selectedYear
                        ? {
                            selectedYear:
                              status === "TotalOrders"
                                ? calculateTotal(
                                    orderStatusComparison.selectedYear
                                  )
                                : orderStatusComparison.selectedYear[status] || 0,
                          }
                        : {}),
                    }))}
                  >
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
                      stroke="#8884d8"
                      name="Current Month"
                    />
                    <Line
                      type="monotone"
                      dataKey="previousMonth"
                      stroke="#82ca9d"
                      name="Previous Month"
                    />
                    {selectedMonth && (
                      <Line
                        type="monotone"
                        dataKey="selectedMonth"
                        stroke="#ff7300"
                        name="Selected Month"
                      />
                    )}
                    {selectedYear && (
                      <Line
                        type="monotone"
                        dataKey="selectedYear"
                        stroke="#d81b60"
                        name="Selected Year"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Procurement Orders
              </h2>
              <table className="min-w-full table-auto text-sm sm:text-base">
                <thead>
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                    <th className="p-2">Client Name</th>
                    <th className="p-2">Part Requested</th>
                    <th className="p-2">Vendor Name</th>
                    <th className="p-2">PO Status</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.order_id}
                      className="border-b border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-2 text-gray-900 dark:text-gray-100">
                        {order.clientName}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100">
                        {order.leadId.partRequested}
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100">
                        {order.vendors?.[0]?.businessName || "N/A"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            statusColor[order.vendors?.[0]?.poStatus] ||
                            "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {order.vendors?.[0]?.poStatus
                            ?.replace(/([A-Z])/g, " $1")
                            .trim() || "N/A"}
                        </span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            statusColor[order.status] ||
                            "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {order.status.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showOrderDetailsModal && (
            <ProcurementOrderDetailsModal
              isOpen={showOrderDetailsModal}
              onClose={() => {
                setShowOrderDetailsModal(false);
                setSelectedMonth("");
                setSelectedYear("");
                setViewMode("full");
              }}
              statusComparison={orderStatusComparison}
              orderAmountTotals={orderAmountTotals}
              deliveredMetrics={deliveredMetrics}
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
    </div>
  );
};

export default ProcurementDashboard;