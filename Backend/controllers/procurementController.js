import mongoose from 'mongoose';
import { Order } from '../models/order.js';

export const getProcurementOrders = async (req, res, next) => {
  console.log("getProcurementOrders working");
  const userId = req.user?.id;
  try {
    if (req.user.role !== 'procurement') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find({ procurementPerson: userId })
      .populate('leadId', 'partRequested')
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => ({
      ...order,
      partRequested: order.leadId?.partRequested || 'N/A',
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching procurement orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProcurementOrderStatusComparison = async (req, res, next) => {
  console.log("getProcurementOrderStatusComparison working");
  const userId = req.user?.id;
  const { selectedMonth = '', selectedYear = '' } = req.query;

  try {
    if (req.user?.role !== 'procurement') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    const previousMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const previousMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    let selectedMonthStart, selectedMonthEnd, selectedYearStart, selectedYearEnd;

    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      selectedMonthStart = new Date(Date.UTC(year, month - 1, 1));
      selectedMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }

    if (selectedYear) {
      selectedYearStart = new Date(Date.UTC(Number(selectedYear), 0, 1));
      selectedYearEnd = new Date(Date.UTC(Number(selectedYear), 11, 31, 23, 59, 59, 999));
    }

    const query = { procurementPerson: new mongoose.Types.ObjectId(userId) };

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

    res.json(response);
  } catch (error) {
    console.error('Error fetching procurement order status comparison:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProcurementOrderAmountTotals = async (req, res) => {
  console.log("getProcurementOrderAmountTotals working");
  const userId = req.user?.id;

  try {
    if (req.user?.role !== 'procurement') {
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

    let selectedMonthQuery = { procurementPerson: new mongoose.Types.ObjectId(userId) };
    let selectedYearQuery = { procurementPerson: new mongoose.Types.ObjectId(userId) };

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(Date.UTC(year, month - 1, 1));
      const selectedMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      selectedMonthQuery.createdAt = { $gte: selectedMonthStart, $lte: selectedMonthEnd };
    }

    if (selectedYear) {
      const yearStart = new Date(Date.UTC(Number(selectedYear), 0, 1));
      const yearEnd = new Date(Date.UTC(Number(selectedYear), 11, 31, 23, 59, 59, 999));
      selectedYearQuery.createdAt = { $gte: yearStart, $lte: yearEnd };
    }

    const amountTotals = async (query) => {
      const result = await Order.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
      ]);
      return result.length > 0 ? result[0].totalAmount : 0;
    };

    const [todayTotal, currentMonthTotal, selectedMonthTotal, selectedYearTotal] = await Promise.all([
      amountTotals({ procurementPerson: new mongoose.Types.ObjectId(userId), createdAt: { $gte: todayStart, $lte: todayEnd } }),
      amountTotals({ procurementPerson: new mongoose.Types.ObjectId(userId), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      selectedMonth ? amountTotals(selectedMonthQuery) : Promise.resolve(0),
      selectedYear ? amountTotals(selectedYearQuery) : Promise.resolve(0),
    ]);

    res.status(200).json({
      today: todayTotal,
      currentMonth: currentMonthTotal,
      ...(selectedMonth && { selectedMonth: selectedMonthTotal }),
      ...(selectedYear && { selectedYear: selectedYearTotal }),
    });
  } catch (error) {
    console.error("Error fetching procurement order amount totals:", error);
    res.status(500).json({ message: "Server error" });
  }
};