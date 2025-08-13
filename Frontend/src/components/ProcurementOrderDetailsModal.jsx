import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector, // Added Sector import
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const ProcurementOrderDetailsModal = ({ isOpen, onClose, statusComparison = { currentMonth: {}, previousMonth: {} }, orderAmountTotals = { today: 0, currentMonth: 0 }, deliveredMetrics = { today: { count: 0, revenue: 0, profit: 0 }, currentMonth: { count: 0, revenue: 0, profit: 0 } }, onMonthChange, onYearChange, selectedMonth, selectedYear, poSentOrders = [], poSentCount = 0, poSentTotalAmount = 0, viewMode = 'full' }) => {
  if (!isOpen) return null;

  const { theme } = useTheme();

  const statusColors = {
    LocatePending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    POPending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    POSent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    POConfirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    VendorPaymentPending: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    VendorPaymentConfirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    ShippingPending: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    ShipOut: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    Intransit: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    Delivered: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    Replacement: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Litigation: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    ReplacementCancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    TotalOrders: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
  };

  const pieColors = ['#00C49F', '#FF8042']; // Green for profit, Orange for revenue
  const lineColors = {
    currentMonth: '#8884d8',
    previousMonth: '#82ca9d',
    selectedMonth: '#ff7300',
    selectedYear: '#d81b60',
  };

  const statuses = [
    'LocatePending', 'POPending', 'POSent', 'POConfirmed', 'VendorPaymentPending',
    'VendorPaymentConfirmed', 'ShippingPending', 'ShipOut', 'Intransit', 'Delivered',
    'Replacement', 'Litigation', 'ReplacementCancelled', 'TotalOrders',
  ];

  const calculateTotal = (data) => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + (count || 0), 0);
  };

  const chartData = statuses.map(status => ({
    status: status === 'TotalOrders' ? 'Total Orders' : status.replace(/([A-Z])/g, ' $1').trim(),
    currentMonth: status === 'TotalOrders' ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0,
    previousMonth: status === 'TotalOrders' ? calculateTotal(statusComparison.previousMonth) : statusComparison.previousMonth?.[status] || 0,
    ...(selectedMonth && statusComparison.selectedMonth ? { selectedMonth: status === 'TotalOrders' ? calculateTotal(statusComparison.selectedMonth) : statusComparison.selectedMonth[status] || 0 } : {}),
    ...(selectedYear && statusComparison.selectedYear ? { selectedYear: status === 'TotalOrders' ? calculateTotal(statusComparison.selectedYear) : statusComparison.selectedYear[status] || 0 } : {}),
  }));

  const periods = [
    { name: 'Current Month', data: deliveredMetrics.currentMonth },
    { name: 'Previous Month', data: deliveredMetrics.previousMonth || { count: 0, revenue: 0, profit: 0 } },
    ...(selectedMonth && deliveredMetrics.selectedMonth ? [{ name: `Selected Month (${selectedMonth})`, data: deliveredMetrics.selectedMonth }] : []),
    ...(selectedYear && deliveredMetrics.selectedYear ? [{ name: `Selected Year (${selectedYear})`, data: deliveredMetrics.selectedYear }] : []),
  ];

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
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

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14}>
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
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`$${value.toFixed(2)}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            {viewMode === 'poSent' ? 'PO Sent Details' : viewMode === 'delivered' ? 'Delivered Details' : viewMode === 'totalOrders' ? 'Total Orders Details' : viewMode === 'todayTotal' ? "Today's Total Details" : 'PO Sent Total Amount Details'}
          </h3>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-6">
          {(viewMode === 'full' || viewMode === 'totalOrders' || viewMode === 'todayTotal' || viewMode === 'delivered' || viewMode === 'poSentTotalAmount') && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <select
                className="w-full sm:w-1/2 border p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                value={selectedMonth || ''}
                onChange={(e) => onMonthChange(e.target.value)}
              >
                <option value="">Select Month to Compare</option>
                {generateMonthOptions().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                className="w-full sm:w-1/2 border p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                value={selectedYear || ''}
                onChange={(e) => onYearChange(e.target.value)}
              >
                <option value="">Select Year to Compare</option>
                {generateYearOptions().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}
          {viewMode === 'poSent' && (
            <>
              {poSentOrders.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <table className="min-w-full table-auto text-base">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Client Name</th>
                          <th className="p-3">Vendor Name</th>
                          <th className="p-3">Total Cost</th>
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
                              <td className="p-3 text-gray-900 dark:text-gray-100">{order.order_id}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">{poSentVendor?.businessName || 'N/A'}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">${(poSentVendor?.totalCost || 0).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between w-full sm:w-auto mb-2 sm:mb-0">
                      <span className="text-gray-600 dark:text-gray-300 text-base">Total PO Sent Orders</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400 ml-4">{poSentCount}</span>
                    </div>
                    <div className="flex justify-between w-full sm:w-auto">
                      <span className="text-gray-600 dark:text-gray-300 text-base">Total PO Sent Amount</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400 ml-4">${(poSentTotalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">No PO Sent orders available.</p>
              )}
            </>
          )}
          {viewMode === 'delivered' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {periods.map((period, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      {period.name}
                    </h4>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Count: <span className="font-bold text-blue-600 dark:text-blue-400">{period.data.count || 0}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Revenue: <span className="font-bold text-green-600 dark:text-green-400">${(period.data.revenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Profit: <span className="font-bold text-purple-600 dark:text-purple-400">${(period.data.profit || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue vs Profit Comparison</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {periods.map((period, index) => {
                    const pieData = [
                      { name: 'Revenue', value: period.data.revenue || 0 },
                      { name: 'Profit', value: period.data.profit || 0 },
                    ].filter(data => data.value > 0);

                    return (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">{period.name}</h5>
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
                                <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                                color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {viewMode === 'totalOrders' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Order Status Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {statuses.map(status => (
                  <div
                    key={status}
                    className={`p-2 rounded-lg text-center ${statusColors[status]}`}
                  >
                    <span className="text-xs font-medium">
                      {status === 'TotalOrders' ? 'Total Orders' : status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="text-md font-bold">
                      {status === 'TotalOrders' ? calculateTotal(statusComparison.currentMonth) : statusComparison.currentMonth?.[status] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {viewMode === 'todayTotal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-base">Today's Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.today || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-base">Current Month Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.currentMonth || 0).toFixed(2)}</span>
              </div>
              {selectedMonth && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Selected Month ({selectedMonth}) Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedMonth || 0).toFixed(2)}</span>
                </div>
              )}
              {selectedYear && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Selected Year ({selectedYear}) Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedYear || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          {viewMode === 'poSentTotalAmount' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 text-base">Current Month PO Sent Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(poSentTotalAmount || 0).toFixed(2)}</span>
              </div>
              {selectedMonth && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Selected Month PO Sent Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(poSentTotalAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {selectedYear && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Selected Year PO Sent Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(poSentTotalAmount || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          {viewMode === 'full' && (
            <>
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Order Status Trends</h4>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Today's Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.today || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">Current Month Total</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.currentMonth || 0).toFixed(2)}</span>
                </div>
                {selectedMonth && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300 text-base">Selected Month ({selectedMonth}) Total</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedMonth || 0).toFixed(2)}</span>
                </div>
                )}
                {selectedYear && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300 text-base">Selected Year ({selectedYear}) Total</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(orderAmountTotals.selectedYear || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">PO Sent Orders</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{poSentCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300 text-base">PO Sent Total Amount</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${(poSentTotalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
              {poSentOrders.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">PO Sent Order Details</h4>
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <table className="min-w-full table-auto text-base">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Client Name</th>
                          <th className="p-3">Vendor Name</th>
                          <th className="p-3">Total Cost</th>
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
                              <td className="p-3 text-gray-900 dark:text-gray-100">{order.order_id}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">{order.clientName}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">{poSentVendor?.businessName || 'N/A'}</td>
                              <td className="p-3 text-gray-900 dark:text-gray-100">${(poSentVendor?.totalCost || 0).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-1.5 border rounded-lg text-base text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
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

export default ProcurementOrderDetailsModal;