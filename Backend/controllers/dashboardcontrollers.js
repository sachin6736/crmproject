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