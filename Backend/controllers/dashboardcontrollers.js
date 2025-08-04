import Lead from "../models/lead.js";
import User from "../models/user.js";

export const getleadcount= async (req,res,next)=>{
    console.log("getleadcountworking")
    try {
        const leadcount = await Lead.countDocuments();
        //console.log("leadcounts",leadcount)
        res.status(200).json({leadcount})
    } catch (error) {
        console.log("error in getsingle",error);
        res.status(500).json({ error: "Internal server error" });
    }
} // getting leads count

export const getcountbystatus = async(req,res,next)=>{
    console.log("countbystatus worrking")
    try {
        const statuscount = await Lead.aggregate([
            {$group: {_id: "$status", count: {$sum :1}}}
        ])
        //console.log("statuscount",statuscount)
        res.status(200).json(statuscount)
    } catch (error) {
        console.log("error",error)
        res.status(500).json({error: "internal server error"})
    }
}//getting the orders by status

export const getorders = async (req,res,next)=>{
    console.log("getorders working")
    try {
        const result = await Lead.find({status:'Ordered'})
        //console.log("orderd",result);
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({error: "internal server error"})
        console.log(error)
    }
}/// getting success orders

export const getmyteam = async (req,res,next)=>{
    console.log("getusers controller working")
    try {
        const team = await User.find({}, "name email role isPaused status createdAt Access")
        //console.log("my team",team)
        res.status(200).json(team)
    } catch (error) {
        console.log("error in getting team",error)
        res.status(500).json({error:"an error occured"})
    }
}

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

  export const getLeadStatusComparison = async (req, res, next) => {
    console.log("getLeadStatusComparison working");
    try {
      const { selectedMonth, selectedYear } = req.query; // e.g., selectedMonth: "2025-07", selectedYear: "2024"
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
      const filters = [
        {
          label: "currentMonth",
          dateFilter: {
            createdAt: { $gte: currentMonthStart, $lte: now }
          }
        },
        {
          label: "previousMonth",
          dateFilter: {
            createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
          }
        }
      ];
  
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-").map(Number);
        const selectedMonthStart = new Date(year, month - 1, 1);
        const selectedMonthEnd = new Date(year, month, 0);
        filters.push({
          label: "selectedMonth",
          dateFilter: {
            createdAt: { $gte: selectedMonthStart, $lte: selectedMonthEnd }
          }
        });
      }
  
      if (selectedYear) {
        const year = Number(selectedYear);
        const selectedYearStart = new Date(year, 0, 1);
        const selectedYearEnd = new Date(year, 11, 31, 23, 59, 59);
        filters.push({
          label: "selectedYear",
          dateFilter: {
            createdAt: { $gte: selectedYearStart, $lte: selectedYearEnd }
          }
        });
      }
  
      const statusCounts = await Promise.all(
        filters.map(async ({ label, dateFilter }) => {
          const counts = await Lead.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } }
          ]);
          return { label, counts };
        })
      );
  
      const response = {};
      statusCounts.forEach(({ label, counts }) => {
        response[label] = counts.reduce((acc, { status, count }) => {
          acc[status] = count;
          return acc;
        }, {});
      });
  
      res.status(200).json(response);
    } catch (error) {
      console.log("error in getLeadStatusComparison", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };