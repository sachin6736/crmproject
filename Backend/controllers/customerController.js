import mongoose from 'mongoose';
import { Order } from '../models/order.js';

export const getCustomerRelationsOrders = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, customerRelationsPerson } = req.query;

    let query = { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson) };
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (selectedYear) {
      query.createdAt = {
        $gte: new Date(selectedYear, 0, 1),
        $lte: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
      };
    }

    const orders = await Order.find(query)
      .populate('leadId salesPerson customerRelationsPerson procurementPerson')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order (newest first)
      .limit(4); // Limit to the latest 4 orders
    res.status(200).json(orders);
    console.log("orders", orders);
  } catch (error) {
    console.error('Error fetching customer relations orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getCustomerRelationsOrderStatusComparison = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, customerRelationsPerson } = req.query;

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);

    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setDate(0);
    const previousMonthStart = new Date(previousMonthEnd);
    previousMonthStart.setDate(1);
    previousMonthStart.setHours(0, 0, 0, 0);

    let selectedMonthQuery = {};
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      selectedMonthQuery = {
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0),
        },
      };
    }

    let selectedYearQuery = {};
    if (selectedYear) {
      selectedYearQuery = {
        createdAt: {
          $gte: new Date(selectedYear, 0, 1),
          $lte: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
        },
      };
    }

    const [currentMonthData, previousMonthData, selectedMonthData, selectedYearData] = await Promise.all([
      Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      selectedMonth ? Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), ...selectedMonthQuery } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]) : Promise.resolve([]),
      selectedYear ? Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), ...selectedYearQuery } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]) : Promise.resolve([]),
    ]);

    const formatData = (data) => {
      const result = {};
      data.forEach(item => {
        result[item.status.replace(/\s+/g, '')] = item.count;
      });
      return result;
    };

    res.status(200).json({
      currentMonth: formatData(currentMonthData),
      previousMonth: formatData(previousMonthData),
      ...(selectedMonth ? { selectedMonth: formatData(selectedMonthData) } : {}),
      ...(selectedYear ? { selectedYear: formatData(selectedYearData) } : {}),
    });
  } catch (error) {
    console.error('Error fetching order status comparison:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomerRelationsOrderAmountTotals = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, customerRelationsPerson } = req.query;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);

    let selectedMonthQuery = {};
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      selectedMonthQuery = {
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0),
        },
      };
    }

    let selectedYearQuery = {};
    if (selectedYear) {
      selectedYearQuery = {
        createdAt: {
          $gte: new Date(selectedYear, 0, 1),
          $lte: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
        },
      };
    }

    const [todayData, currentMonthData, selectedMonthData, selectedYearData] = await Promise.all([
      Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      selectedMonth ? Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), ...selectedMonthQuery } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]) : Promise.resolve([]),
      selectedYear ? Order.aggregate([
        { $match: { customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson), ...selectedYearQuery } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]) : Promise.resolve([]),
    ]);

    res.status(200).json({
      today: todayData[0]?.total || 0,
      currentMonth: currentMonthData[0]?.total || 0,
      ...(selectedMonth ? { selectedMonth: selectedMonthData[0]?.total || 0 } : {}),
      ...(selectedYear ? { selectedYear: selectedYearData[0]?.total || 0 } : {}),
    });
  } catch (error) {
    console.error('Error fetching order amount totals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomerRelationsDeliveredMetrics = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, customerRelationsPerson } = req.query;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);

    let selectedMonthQuery = {};
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      selectedMonthQuery = {
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0),
        },
      };
    }

    let selectedYearQuery = {};
    if (selectedYear) {
      selectedYearQuery = {
        createdAt: {
          $gte: new Date(selectedYear, 0, 1),
          $lte: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
        },
      };
    }

    const deliveredMetrics = async (query) => {
      const result = await Order.aggregate([
        {
          $match: {
            customerRelationsPerson: new mongoose.Types.ObjectId(customerRelationsPerson),
            status: "Delivered",
            ...query,
          },
        },
        {
          $unwind: "$vendors",
        },
        {
          $match: {
            "vendors.isConfirmed": true,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
            profit: { $sum: { $subtract: ["$amount", "$vendors.totalCost"] } },
          },
        },
      ]);
      return result.length > 0
        ? { count: result[0].count, revenue: result[0].revenue || 0, profit: result[0].profit || 0 }
        : { count: 0, revenue: 0, profit: 0 };
    };

    const [todayMetrics, currentMonthMetrics, selectedMonthMetrics, selectedYearMetrics] = await Promise.all([
      deliveredMetrics({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      deliveredMetrics({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      selectedMonth ? deliveredMetrics(selectedMonthQuery) : Promise.resolve({ count: 0, revenue: 0, profit: 0 }),
      selectedYear ? deliveredMetrics(selectedYearQuery) : Promise.resolve({ count: 0, revenue: 0, profit: 0 }),
    ]);

    res.status(200).json({
      today: todayMetrics,
      currentMonth: currentMonthMetrics,
      ...(selectedMonth ? { selectedMonth: selectedMonthMetrics } : {}),
      ...(selectedYear ? { selectedYear: selectedYearMetrics } : {}),
    });
  } catch (error) {
    console.error("Error fetching delivered metrics:", error);
    res.status(500).json({ message: "Server error" });
  }
};