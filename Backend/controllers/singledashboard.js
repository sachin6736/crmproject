import Lead from "../models/lead.js";
import User from "../models/user.js";
import StatusLog from "../models/statusLog.js";
import { Order } from "../models/order.js";
import mongoose from 'mongoose'


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
    console.log("thsi are leads",leads)
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
  console.log("req.query:", req.query); // Log query parameters

  // Destructure with defaults to avoid undefined
  const { selectedMonth = '', selectedYear = '' } = req.query;

  try {
    if (req.user?.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear(); // 2025
    const currentMonth = now.getUTCMonth(); // 7 (August, 0-indexed)
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1)); // 2025-08-01
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)); // 2025-08-31
    const previousMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1)); // 2025-07-01
    const previousMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)); // 2025-07-31

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
      currentMonth: formatData(currentMonthOrders),
      previousMonth: formatData(previousMonthOrders),
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
  console.log("req.query:", req.query); // Log query parameters

  // Destructure with defaults to avoid undefined
  const { selectedMonth = '', selectedYear = '' } = req.query;

  try {
    if (req.user?.role !== 'sales') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear(); // 2025
    const currentMonth = now.getUTCMonth(); // 7 (August, 0-indexed)
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1)); // 2025-08-01
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)); // 2025-08-31
    const previousMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1)); // 2025-07-01
    const previousMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)); // 2025-07-31

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

    // Count leads where the user is the salesPerson and createdBy is true (manually created)
    const createdByUser = await Lead.countDocuments({
      salesPerson: userId,
      createdBy: true,
    });

    // Count leads where the user is the salesPerson and createdBy is false (automatically assigned)
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
    // Log status change
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

    // Verify admin access
    if (req.user.role !== "admin") {
      console.log("admin access");
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    // Validate date
    if (!date) {
      console.log("no date");
      return res.status(400).json({ message: "Date parameter is required." });
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Set start and end of the day
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Determine if the selected date is today
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    const endTime = isToday ? now : endOfDay;

    // Build query
    const query = {
      userId,
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    // Fetch logs
    const logs = await StatusLog.find(query)
      .sort({ timestamp: 1 })
      .lean();

    if (!logs.length) {
      return res.status(200).json({ message: "No status logs found for the selected date.", durations: {} });
    }

    // Initialize durations
    const durations = {
      Available: 0,
      OnBreak: 0,
      Lunch: 0,
      Meeting: 0,
      LoggedOut: 0,
    };

    // Calculate durations for all logs except the last
    for (let i = 0; i < logs.length - 1; i++) {
      const currentLog = logs[i];
      const nextLog = logs[i + 1];
      const durationMs = nextLog.timestamp - currentLog.timestamp;
      if (durationMs > 0) {
        durations[currentLog.status] += durationMs / (1000 * 60 * 60); // Hours
      }
    }

    // Handle the last log
    const lastLog = logs[logs.length - 1];
    if (lastLog.status === "LoggedOut") {
      // Assign 0 duration for "LoggedOut" status
      durations[lastLog.status] = 0;
    } else {
      // Calculate duration up to endTime (current time for today, endOfDay for past dates)
      const lastDurationMs = endTime - lastLog.timestamp;
      if (lastDurationMs > 0) {
        durations[lastLog.status] += lastDurationMs / (1000 * 60 * 60); // Hours
      }
    }

    // Round to 2 decimal places
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

export const getAllUsers =  async (req,res,next)=>{
    console.log("getusers controller working")
    try {
        const team = await User.find({}, "name email role isPaused status createdAt")
        console.log("my team",team)
        res.status(200).json(team)
    } catch (error) {
        console.log("error in getting team",error)
        res.status(500).json({error:"an error occured"})
    }
}