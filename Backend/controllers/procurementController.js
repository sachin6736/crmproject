import mongoose from 'mongoose';
import { Order } from '../models/order.js';

export const getProcurementOrders = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, procurementPerson } = req.query;

    let query = { procurementPerson: new mongoose.Types.ObjectId(procurementPerson) };
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

    const orders = await Order.find(query).populate('leadId salesPerson customerRelationsPerson procurementPerson');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching procurement orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProcurementOrderStatusComparison = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, procurementPerson } = req.query;

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
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      selectedMonth ? Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), ...selectedMonthQuery } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]) : Promise.resolve([]),
      selectedYear ? Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), ...selectedYearQuery } },
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

export const getProcurementOrderAmountTotals = async (req, res) => {
  try {
    const { selectedMonth, selectedYear, procurementPerson } = req.query;

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
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      selectedMonth ? Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), ...selectedMonthQuery } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]) : Promise.resolve([]),
      selectedYear ? Order.aggregate([
        { $match: { procurementPerson: new mongoose.Types.ObjectId(procurementPerson), ...selectedYearQuery } },
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