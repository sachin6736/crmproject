import Lead from "../models/lead.js";
import User from "../models/user.js";
import StatusLog from "../models/statusLog.js";
import { Order } from "../models/order.js";
import mongoose from 'mongoose';

export const singleleads = async (req, res, next) => {
  console.log("singlesales working");
  const userId = req.user?.id;
  console.log("user by singlesales", userId);
  try {
    if (req.user.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leads = await Lead.find({ salesPerson: req.user.id }).sort({ createdAt: -1 });
    res.json(leads);
    console.log("these are leads", leads);
  } catch (error) {
    console.error('Error fetching sales leads:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getsingleorders = async (req, res, next) => {
  console.log("getsingleorders working");
  const userId = req.user?.id;
  try {
    if (req.user.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find({ salesPerson: userId })
      .populate('leadId', 'partRequested')
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => ({
      ...order,
      partRequested: order.leadId?.partRequested || 'N/A',
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderStatusComparison = async (req, res, next) => {
  console.log("getOrderStatusComparison working");
  const userId = req.user?.id;
  console.log("userId:", userId);
  console.log("req.query:", req.query);

  const { selectedMonth = '', selectedYear = '' } = req.query;

  try {
    if (req.user?.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    const previousMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const previousMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
    const currentYearStart = new Date(Date.UTC(currentYear, 0, 1));
    const currentYearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    console.log("todayStart:", todayStart, "todayEnd:", todayEnd);
    console.log("currentMonthStart:", currentMonthStart, "currentMonthEnd:", currentMonthEnd);
    console.log("previousMonthStart:", previousMonthStart, "previousMonthEnd:", previousMonthEnd);
    console.log("currentYearStart:", currentYearStart, "currentYearEnd:", currentYearEnd);

    let selectedMonthStart, selectedMonthEnd, selectedYearStart, selectedYearEnd;

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      selectedMonthStart = new Date(Date.UTC(year, month - 1, 1));
      selectedMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      console.log("selectedMonthStart:", selectedMonthStart, "selectedMonthEnd:", selectedMonthEnd);
    }

    if (selectedYear) {
      selectedYearStart = new Date(Date.UTC(Number(selectedYear), 0, 1));
      selectedYearEnd = new Date(Date.UTC(Number(selectedYear), 11, 31, 23, 59, 59, 999));
      console.log("selectedYearStart:", selectedYearStart, "selectedYearEnd:", selectedYearEnd);
    }

    const query = { salesPerson: new mongoose.Types.ObjectId(userId) };

    const todayOrders = await Order.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const currentMonthOrders = await Order.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("currentMonthOrders:", currentMonthOrders);

    const previousMonthOrders = await Order.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("previousMonthOrders:", previousMonthOrders);

    const currentYearOrders = await Order.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: currentYearStart, $lte: currentYearEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("currentYearOrders:", currentYearOrders);

    let selectedMonthOrders = [];
    if (selectedMonth) {
      selectedMonthOrders = await Order.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      console.log("selectedMonthOrders:", selectedMonthOrders);
    }

    let selectedYearOrders = [];
    if (selectedYear) {
      selectedYearOrders = await Order.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: selectedYearStart, $lte: selectedYearEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      console.log("selectedYearOrders:", selectedYearOrders);
    }

    const formatData = (orders) =>
      orders.reduce((acc, { _id, count }) => {
        const normalizedKey = _id.replace(/\s+/g, '');
        acc[normalizedKey] = count;
        return acc;
      }, {});

    const response = {
      today: formatData(todayOrders),
      currentMonth: formatData(currentMonthOrders),
      previousMonth: formatData(previousMonthOrders),
      currentYear: formatData(currentYearOrders),
      ...(selectedMonth ? { selectedMonth: formatData(selectedMonthOrders) } : {}),
      ...(selectedYear ? { selectedYear: formatData(selectedYearOrders) } : {}),
    };

    console.log("Response:", response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching order status comparison:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeadStatusComparison = async (req, res, next) => {
  console.log("getLeadStatusComparison working");
  const userId = req.user?.id;
  console.log("userId:", userId);
  console.log("req.query:", req.query);

  const { selectedMonth = '', selectedYear = '' } = req.query;

  try {
    if (req.user?.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    const previousMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const previousMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    console.log("currentMonthStart:", currentMonthStart, "currentMonthEnd:", currentMonthEnd);
    console.log("previousMonthStart:", previousMonthStart, "previousMonthEnd:", previousMonthEnd);

    let selectedMonthStart, selectedMonthEnd, selectedYearStart, selectedYearEnd;

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      selectedMonthStart = new Date(Date.UTC(year, month - 1, 1));
      selectedMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      console.log("selectedMonthStart:", selectedMonthStart, "selectedMonthEnd:", selectedMonthEnd);
    }

    if (selectedYear) {
      selectedYearStart = new Date(Date.UTC(Number(selectedYear), 0, 1));
      selectedYearEnd = new Date(Date.UTC(Number(selectedYear), 11, 31, 23, 59, 59, 999));
      console.log("selectedYearStart:", selectedYearStart, "selectedYearEnd:", selectedYearEnd);
    }

    const query = { salesPerson: new mongoose.Types.ObjectId(userId) };

    const currentMonthLeads = await Lead.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("currentMonthLeads:", currentMonthLeads);

    const previousMonthLeads = await Lead.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("previousMonthLeads:", previousMonthLeads);

    let selectedMonthLeads = [];
    if (selectedMonth) {
      selectedMonthLeads = await Lead.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      console.log("selectedMonthLeads:", selectedMonthLeads);
    }

    let selectedYearLeads = [];
    if (selectedYear) {
      selectedYearLeads = await Lead.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: selectedYearStart, $lte: selectedYearEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      console.log("selectedYearLeads:", selectedYearLeads);
    }

    const formatData = (leads) =>
      leads.reduce((acc, { _id, count }) => {
        const normalizedKey = _id.replace(/\s+/g, '');
        acc[normalizedKey] = count;
        return acc;
      }, {});

    const response = {
      currentMonth: formatData(currentMonthLeads),
      previousMonth: formatData(previousMonthLeads),
      ...(selectedMonth ? { selectedMonth: formatData(selectedMonthLeads) } : {}),
      ...(selectedYear ? { selectedYear: formatData(selectedYearLeads) } : {}),
    };

    console.log("Response:", response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching lead status comparison:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeadCreationCounts = async (req, res, next) => {
  console.log("getLeadCreationCounts working");
  const userId = req.user?.id;

  try {
    if (req.user.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const createdByUser = await Lead.countDocuments({
      salesPerson: userId,
      createdBy: true,
    });

    const assignedAutomatically = await Lead.countDocuments({
      salesPerson: userId,
      createdBy: false,
    });

    res.json({
      createdByUser,
      assignedAutomatically,
    });
  } catch (error) {
    console.error('Error fetching lead creation counts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changestatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validstatus = ['Available', 'OnBreak', 'Lunch', 'Meeting', 'LoggedOut'];
    if (!validstatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('name email status');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const statusLog = new StatusLog({
      userId: id,
      status,
      timestamp: new Date(),
    });
    await statusLog.save();
    res.status(200).json({ message: 'Status updated successfully.', user });
  } catch (error) {
    console.error('Error in changing status:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getStatusDurations = async (req, res, next) => {
  console.log("status count working");
  try {
    const { userId } = req.params;
    console.log(userId);
    const { date } = req.query;
    console.log("date", date);

    if (req.user.role !== "admin") {
      console.log("admin access");
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    if (!date) {
      console.log("no date");
      return res.status(400).json({ message: "Date parameter is required." });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    const endTime = isToday ? now : endOfDay;

    const query = {
      userId,
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    const logs = await StatusLog.find(query)
      .sort({ timestamp: 1 })
      .lean();

    if (!logs.length) {
      return res.status(200).json({ message: "No status logs found for the selected date.", durations: {} });
    }

    const durations = {
      Available: 0,
      OnBreak: 0,
      Lunch: 0,
      Meeting: 0,
      LoggedOut: 0,
    };

    for (let i = 0; i < logs.length - 1; i++) {
      const currentLog = logs[i];
      const nextLog = logs[i + 1];
      const durationMs = nextLog.timestamp - currentLog.timestamp;
      if (durationMs > 0) {
        durations[currentLog.status] += durationMs / (1000 * 60 * 60);
      }
    }

    const lastLog = logs[logs.length - 1];
    if (lastLog.status === "LoggedOut") {
      durations[lastLog.status] = 0;
    } else {
      const lastDurationMs = endTime - lastLog.timestamp;
      if (lastDurationMs > 0) {
        durations[lastLog.status] += lastDurationMs / (1000 * 60 * 60);
      }
    }

    Object.keys(durations).forEach((key) => {
      durations[key] = Number(durations[key].toFixed(2));
    });

    res.status(200).json({ durations });
    console.log("durations", durations);
  } catch (error) {
    console.error("Error fetching status durations:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getAllUsers = async (req, res, next) => {
  console.log("getusers controller working");
  try {
    const team = await User.find({}, "name email role isPaused status createdAt");
    console.log("my team", team);
    res.status(200).json(team);
  } catch (error) {
    console.log("error in getting team", error);
    res.status(500).json({ error: "an error occurred" });
  }
};

export const getOrderAmountTotals = async (req, res) => {
  console.log("getOrderAmountTotals working");
  const userId = req.user?.id;
  console.log("userId:", userId);
  console.log("req.query:", req.query);

  try {
    if (req.user?.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { selectedMonth = '', selectedYear = '' } = req.query;
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
    const currentYearStart = new Date(Date.UTC(currentYear, 0, 1));
    const currentYearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    console.log("todayStart:", todayStart, "todayEnd:", todayEnd);
    console.log("currentMonthStart:", currentMonthStart, "currentMonthEnd:", currentMonthEnd);
    console.log("currentYearStart:", currentYearStart, "currentYearEnd:", currentYearEnd);

    let selectedMonthQuery = { salesPerson: new mongoose.Types.ObjectId(userId) };
    let selectedYearQuery = { salesPerson: new mongoose.Types.ObjectId(userId) };

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(Date.UTC(year, month - 1, 1));
      const selectedMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      selectedMonthQuery.createdAt = { $gte: selectedMonthStart, $lte: selectedMonthEnd };
      console.log("selectedMonthStart:", selectedMonthStart, "selectedMonthEnd:", selectedMonthEnd);
    }

    if (selectedYear) {
      const yearStart = new Date(Date.UTC(Number(selectedYear), 0, 1));
      const yearEnd = new Date(Date.UTC(Number(selectedYear), 11, 31, 23, 59, 59, 999));
      selectedYearQuery.createdAt = { $gte: yearStart, $lte: yearEnd };
      console.log("selectedYearStart:", yearStart, "selectedYearEnd:", yearEnd);
    }

    const amountTotals = async (query) => {
      const result = await Order.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
      ]);
      return result.length > 0 ? result[0].totalAmount : 0;
    };

    const [todayTotal, currentMonthTotal, currentYearTotal, selectedMonthTotal, selectedYearTotal] = await Promise.all([
      amountTotals({ salesPerson: new mongoose.Types.ObjectId(userId), createdAt: { $gte: todayStart, $lte: todayEnd } }),
      amountTotals({ salesPerson: new mongoose.Types.ObjectId(userId), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      amountTotals({ salesPerson: new mongoose.Types.ObjectId(userId), createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? amountTotals(selectedMonthQuery) : Promise.resolve(0),
      selectedYear ? amountTotals(selectedYearQuery) : Promise.resolve(0),
    ]);

    console.log("Order Amount Totals:");
    console.log(`Today's Total: $${todayTotal.toFixed(2)}`);
    console.log(`Current Month Total: $${currentMonthTotal.toFixed(2)}`);
    console.log(`Current Year Total: $${currentYearTotal.toFixed(2)}`);
    if (selectedMonth) {
      console.log(`Selected Month (${selectedMonth}) Total: $${selectedMonthTotal.toFixed(2)}`);
    }
    if (selectedYear) {
      console.log(`Selected Year (${selectedYear}) Total: $${selectedYearTotal.toFixed(2)}`);
    }

    res.status(200).json({
      today: todayTotal,
      currentMonth: currentMonthTotal,
      currentYear: currentYearTotal,
      ...(selectedMonth && { selectedMonth: selectedMonthTotal }),
      ...(selectedYear && { selectedYear: selectedYearTotal }),
    });
  } catch (error) {
    console.error("Error fetching order amount totals:", error);
    res.status(500).json({ message: "Server error" });
  }
};