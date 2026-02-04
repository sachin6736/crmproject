import Lead from "../models/lead.js";
import User from "../models/user.js";
import { Order } from "../models/order.js";

export const getleadcount = async (req, res, next) => {
  console.log("getleadcount working");
  try {
    // Get the first day of the current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    // Get the first day of next month (exclusive end boundary)
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const leadcount = await Lead.countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    res.status(200).json({ leadcount });
  } catch (error) {
    console.error("Error in getleadcount:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getcountbystatus = async (req, res, next) => {
    console.log("countbystatus worrking");
    try {
        const statuscount = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        res.status(200).json(statuscount);
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: "internal server error" });
    }
};

export const getorders = async (req, res, next) => {
    console.log("getorders working");
    try {
        const result = await Lead.find({ status: 'Ordered' });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "internal server error" });
        console.log(error);
    }
};

export const getmyteam = async (req, res, next) => {
  console.log("getusers controller working");
  try {
    const team = await User.find({}, "name email password role isPaused status createdAt Access Editcost");
    res.status(200).json(team);
  } catch (error) {
    console.log("error in getting team", error);
    res.status(500).json({ error: "an error occurred" });
  }
};

export const getLeadCreationCounts = async (req, res, next) => {
    console.log("getLeadCreationCounts working");
    try {
      const creationCounts = await Lead.aggregate([
        { $group: { _id: "$createdBy", count: { $sum: 1 } } },
        { $project: { _id: 0, createdBy: "$_id", count: 1 } }
      ]);
  
      const createdByUser = creationCounts.find(item => item.createdBy === true)?.count || 0;
      const assignedAutomatically = creationCounts.find(item => item.createdBy === false)?.count || 0;
  
      res.status(200).json({ createdByUser, assignedAutomatically });
    } catch (error) {
      console.log("error in getLeadCreationCounts", error);
      res.status(500).json({ error: "Internal server error" });
    }
};

export const getOrderCounts = async (req, res) => {
  try {
    const { selectedMonth, selectedYear } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0);
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);

    let selectedMonthQuery = {};
    let selectedYearQuery = {};

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      selectedMonthQuery = {
        createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
      };
    }

    if (selectedYear) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      selectedYearQuery = {
        createdAt: { $gte: yearStart, $lte: yearEnd },
      };
    }

    const orderCounts = async (query) => {
      const count = await Order.countDocuments(query);
      return count;
    };

    const [todayCount, currentMonthCount, currentYearCount, selectedMonthCount, selectedYearCount, totalOrders] = await Promise.all([
      orderCounts({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      orderCounts({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      orderCounts({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? orderCounts(selectedMonthQuery) : Promise.resolve(0),
      selectedYear ? orderCounts(selectedYearQuery) : Promise.resolve(0),
      Order.countDocuments({}), // Fetch total number of orders in the database
    ]);

    res.status(200).json({
      today: todayCount,
      currentMonth: currentMonthCount,
      currentYear: currentYearCount,
      totalOrders, // Include total orders
      ...(selectedMonth && { selectedMonth: selectedMonthCount }),
      ...(selectedYear && { selectedYear: selectedYearCount }),
    });
  } catch (error) {
    console.error("Error fetching order counts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeadStatusComparison = async (req, res) => {
    try {
      const { selectedMonth, selectedYear } = req.query;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
  
      const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth, 0);
      const previousMonthStart = new Date(currentYear, currentMonth - 2, 1);
      const previousMonthEnd = new Date(currentYear, currentMonth - 1, 0);
  
      const currentMonthQuery = {
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      };
      const previousMonthQuery = {
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
      };
      let selectedMonthQuery = {};
      let selectedYearQuery = {};
  
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-").map(Number);
        const selectedMonthStart = new Date(year, month - 1, 1);
        const selectedMonthEnd = new Date(year, month, 0);
        selectedMonthQuery = {
          createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
        };
      }
  
      if (selectedYear) {
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        selectedYearQuery = {
          createdAt: { $gte: yearStart, $lte: yearEnd },
        };
      }
  
      const statusCounts = async (query) => {
        const counts = await Lead.aggregate([
          { $match: query },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const result = {};
        counts.forEach(({ _id, count }) => {
          result[_id] = count;
        });
        return result;
      };
  
      const [currentMonthCounts, previousMonthCounts, selectedMonthCounts, selectedYearCounts] = await Promise.all([
        statusCounts(currentMonthQuery),
        statusCounts(previousMonthQuery),
        selectedMonth ? statusCounts(selectedMonthQuery) : Promise.resolve({}),
        selectedYear ? statusCounts(selectedYearQuery) : Promise.resolve({}),
      ]);
  
      res.status(200).json({
        currentMonth: currentMonthCounts,
        previousMonth: previousMonthCounts,
        ...(selectedMonth && { selectedMonth: selectedMonthCounts }),
        ...(selectedYear && { selectedYear: selectedYearCounts }),
      });
    } catch (error) {
      console.error("Error fetching lead status comparison:", error);
      res.status(500).json({ message: "Server error" });
    }
};

export const getOrderStatusComparison = async (req, res) => {
  try {
    const { selectedMonth, selectedYear } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0);
    const previousMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth - 1, 0);
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);

    let selectedMonthQuery = {};
    let selectedYearQuery = {};

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      selectedMonthQuery = {
        createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
      };
    }

    if (selectedYear) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      selectedYearQuery = {
        createdAt: { $gte: yearStart, $lte: yearEnd },
      };
    }

    const statusCounts = async (query) => {
      const result = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
      ]);
      const counts = {};
      result.forEach(({ status, count }) => {
        counts[status] = count;
      });
      counts.TotalOrders = Object.values(counts).reduce((sum, count) => sum + count, 0);
      return counts;
    };

    const [currentMonthCounts, previousMonthCounts, currentYearCounts, selectedMonthCounts, selectedYearCounts] = await Promise.all([
      statusCounts({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      statusCounts({ createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
      statusCounts({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? statusCounts(selectedMonthQuery) : Promise.resolve({}),
      selectedYear ? statusCounts(selectedYearQuery) : Promise.resolve({}),
    ]);

    console.log("currentYearCounts:", currentYearCounts); // Debug log
    console.log("selectedYearCounts:", selectedYearCounts); // Debug log

    res.status(200).json({
      currentMonth: currentMonthCounts,
      previousMonth: previousMonthCounts,
      currentYear: currentYearCounts,
      ...(selectedMonth && { selectedMonth: selectedMonthCounts }),
      ...(selectedYear && { selectedYear: selectedYearCounts }),
    });
  } catch (error) {
    console.error("Error fetching order status comparison:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOrderAmountTotals = async (req, res) => {
  try {
    const { selectedMonth, selectedYear } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0);
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);

    let selectedMonthQuery = {};
    let selectedYearQuery = {};

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      selectedMonthQuery = {
        createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
      };
    }

    if (selectedYear) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      selectedYearQuery = {
        createdAt: { $gte: yearStart, $lte: yearEnd },
      };
    }

    const amountTotals = async (query) => {
      const result = await Order.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]);
      return result.length > 0 ? result[0].totalAmount : 0;
    };

    const [todayTotal, currentMonthTotal, currentYearTotal, selectedMonthTotal, selectedYearTotal] = await Promise.all([
      amountTotals({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      amountTotals({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      amountTotals({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? amountTotals(selectedMonthQuery) : Promise.resolve(0),
      selectedYear ? amountTotals(selectedYearQuery) : Promise.resolve(0),
    ]);

    console.log("todayTotal", todayTotal);
    console.log("currentMonthTotal", currentMonthTotal);
    console.log("currentYearTotal", currentYearTotal);
    console.log("selectedMonthTotal", selectedMonthTotal);
    console.log("selectedYearTotal", selectedYearTotal);

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

export const getLeadCountsAndConversions = async (req, res) => {
  try {
    const { selectedMonth, selectedYear } = req.query; // Already correctly destructured
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0);
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);
    const previousMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth - 1, 0);

    let selectedMonthQuery = {};
    let selectedYearQuery = {};

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      selectedMonthQuery = {
        createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
      };
    }

    if (selectedYear) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      selectedYearQuery = {
        createdAt: { $gte: yearStart, $lte: yearEnd },
      };
    }

    const leadCounts = async (query) => {
      return await Lead.countDocuments(query);
    };

    const conversionRates = async (query) => {
      const [total, converted] = await Promise.all([
        Lead.countDocuments(query),
        Lead.countDocuments({ ...query, status: "Ordered" }),
      ]);
      const rate = total > 0 ? (converted / total) * 100 : 0;
      return { converted, total, rate };
    };

    const statusCounts = async (query) => {
      const counts = await Lead.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const result = {};
      counts.forEach(({ _id, count }) => {
        result[_id] = count;
      });
      return result;
    };

    const [
      todayCount,
      currentMonthCount,
      currentYearCount,
      selectedMonthCount,
      selectedYearCount,
      currentMonthConversion,
      currentYearConversion,
      selectedMonthConversion,
      selectedYearConversion,
      currentMonthStatus,
      previousMonthStatus,
      currentYearStatus,
      selectedMonthStatus,
      selectedYearStatus,
    ] = await Promise.all([
      leadCounts({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      leadCounts({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      leadCounts({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? leadCounts(selectedMonthQuery) : Promise.resolve(0),
      selectedYear ? leadCounts(selectedYearQuery) : Promise.resolve(0),
      conversionRates({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      conversionRates({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? conversionRates(selectedMonthQuery) : Promise.resolve({ converted: 0, total: 0, rate: 0 }),
      selectedYear ? conversionRates(selectedYearQuery) : Promise.resolve({ converted: 0, total: 0, rate: 0 }),
      statusCounts({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      statusCounts({ createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
      statusCounts({ createdAt: { $gte: currentYearStart, $lte: currentYearEnd } }),
      selectedMonth ? statusCounts(selectedMonthQuery) : Promise.resolve({}),
      selectedYear ? statusCounts(selectedYearQuery) : Promise.resolve({}),
    ]);

    res.status(200).json({
      leadCounts: {
        today: todayCount,
        currentMonth: currentMonthCount,
        currentYear: currentYearCount,
        ...(selectedMonth && { selectedMonth: selectedMonthCount }),
        ...(selectedYear && { selectedYear: selectedYearCount }),
      },
      conversionRates: {
        currentMonth: currentMonthConversion,
        currentYear: currentYearConversion,
        ...(selectedMonth && { selectedMonth: selectedMonthConversion }),
        ...(selectedYear && { selectedYear: selectedYearConversion }),
      },
      statusComparison: {
        currentMonth: currentMonthStatus,
        previousMonth: previousMonthStatus,
        currentYear: currentYearStatus,
        ...(selectedMonth && { selectedMonth: selectedMonthStatus }),
        ...(selectedYear && { selectedYear: selectedYearStatus }),
      },
    });
  } catch (error) {
    console.error("Error fetching lead counts and conversions:", error);
    // Define default response structure without relying on undefined variables
    res.status(500).json({
      message: "Server error",
      conversionRates: {
        currentMonth: { converted: 0, total: 0, rate: 0 },
        currentYear: { converted: 0, total: 0, rate: 0 },
        ...(req.query.selectedMonth && { selectedMonth: { converted: 0, total: 0, rate: 0 } }),
        ...(req.query.selectedYear && { selectedYear: { converted: 0, total: 0, rate: 0 } }),
      },
      leadCounts: {
        today: 0,
        currentMonth: 0,
        currentYear: 0,
        ...(req.query.selectedMonth && { selectedMonth: 0 }),
        ...(req.query.selectedYear && { selectedYear: 0 }),
      },
      statusComparison: {
        currentMonth: {},
        previousMonth: {},
        currentYear: {},
        ...(req.query.selectedMonth && { selectedMonth: {} }),
        ...(req.query.selectedYear && { selectedYear: {} }),
      },
    });
  }
};

export const getPoSentCountsAndTotals = async (req, res) => {
  try {
    const { selectedMonth, selectedYear } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0);

    let selectedMonthQuery = {};
    let selectedYearQuery = {};

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const selectedMonthStart = new Date(year, month - 1, 1);
      const selectedMonthEnd = new Date(year, month, 0);
      selectedMonthQuery = {
        createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
      };
    }

    if (selectedYear) {
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      selectedYearQuery = {
        createdAt: { $gte: yearStart, $lte: yearEnd },
      };
    }

    // Aggregate PO metrics for a given query, grouping by poStatus
    const poMetrics = async (query) => {
      const result = await Order.aggregate([
        { $match: query },
        { $unwind: "$vendors" },
        {
          $group: {
            _id: "$vendors.poStatus",
            count: { $sum: 1 },
            totalAmount: { $sum: "$vendors.totalCost" },
          },
        },
        {
          $group: {
            _id: null,
            statuses: {
              $push: {
                status: "$_id",
                count: "$count",
                totalAmount: "$totalAmount",
              },
            },
            totalPOs: { $sum: "$count" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            totalPOs: 1,
            totalAmount: 1,
            poSent: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statuses",
                    as: "status",
                    cond: { $eq: ["$$status.status", "PO Sent"] },
                  },
                },
                0,
              ],
            },
            poConfirmed: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statuses",
                    as: "status",
                    cond: { $eq: ["$$status.status", "PO Confirmed"] },
                  },
                },
                0,
              ],
            },
            poCanceled: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$statuses",
                    as: "status",
                    cond: { $eq: ["$$status.status", "PO Canceled"] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            totalPOs: 1,
            totalAmount: 1,
            poSent: {
              count: { $ifNull: ["$poSent.count", 0] },
              totalAmount: { $ifNull: ["$poSent.totalAmount", 0] },
            },
            poConfirmed: {
              count: { $ifNull: ["$poConfirmed.count", 0] },
              totalAmount: { $ifNull: ["$poConfirmed.totalAmount", 0] },
            },
            poCanceled: {
              count: { $ifNull: ["$poCanceled.count", 0] },
              totalAmount: { $ifNull: ["$poCanceled.totalAmount", 0] },
            },
          },
        },
      ]);

      return result.length > 0
        ? {
            totalPOs: result[0].totalPOs || 0,
            totalAmount: result[0].totalAmount || 0,
            poSent: result[0].poSent || { count: 0, totalAmount: 0 },
            poConfirmed: result[0].poConfirmed || { count: 0, totalAmount: 0 },
            poCanceled: result[0].poCanceled || { count: 0, totalAmount: 0 },
          }
        : {
            totalPOs: 0,
            totalAmount: 0,
            poSent: { count: 0, totalAmount: 0 },
            poConfirmed: { count: 0, totalAmount: 0 },
            poCanceled: { count: 0, totalAmount: 0 },
          };
    };

    const [todayMetrics, currentMonthMetrics, selectedMonthMetrics, selectedYearMetrics] = await Promise.all([
      poMetrics({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      poMetrics({ createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd } }),
      selectedMonth ? poMetrics(selectedMonthQuery) : Promise.resolve({ totalPOs: 0, totalAmount: 0, poSent: { count: 0, totalAmount: 0 }, poConfirmed: { count: 0, totalAmount: 0 }, poCanceled: { count: 0, totalAmount: 0 } }),
      selectedYear ? poMetrics(selectedYearQuery) : Promise.resolve({ totalPOs: 0, totalAmount: 0, poSent: { count: 0, totalAmount: 0 }, poConfirmed: { count: 0, totalAmount: 0 }, poCanceled: { count: 0, totalAmount: 0 } }),
    ]);

    res.status(200).json({
      today: todayMetrics,
      currentMonth: currentMonthMetrics,
      ...(selectedMonth && { selectedMonth: selectedMonthMetrics }),
      ...(selectedYear && { selectedYear: selectedYearMetrics }),
    });
  } catch (error) {
    console.error("Error fetching PO counts and totals:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDeliveredMetrics = async (req, res) => {
  try {
      const { selectedMonth, selectedYear } = req.query;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth, 0);

      let selectedMonthQuery = {};
      let selectedYearQuery = {};

      if (selectedMonth) {
          const [year, month] = selectedMonth.split("-").map(Number);
          const selectedMonthStart = new Date(year, month - 1, 1);
          const selectedMonthEnd = new Date(year, month, 0);
          selectedMonthQuery = {
              createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd },
          };
      }

      if (selectedYear) {
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31);
          selectedYearQuery = {
              createdAt: { $gte: yearStart, $lte: yearEnd },
          };
      }

      const deliveredMetrics = async (query) => {
          const result = await Order.aggregate([
              {
                  $match: {
                      ...query,
                      status: "Delivered",
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

      console.log("todayMetrics", todayMetrics);
      console.log("currentMonthMetrics", currentMonthMetrics);
      console.log("selectedMonthMetrics", selectedMonthMetrics);
      console.log("selectedYearMetrics", selectedYearMetrics);

      res.status(200).json({
          today: todayMetrics,
          currentMonth: currentMonthMetrics,
          ...(selectedMonth && { selectedMonth: selectedMonthMetrics }),
          ...(selectedYear && { selectedYear: selectedYearMetrics }),
      });
  } catch (error) {
      console.error("Error fetching delivered metrics:", error);
      res.status(500).json({ message: "Server error" });
  }
};

