import Lead from "../models/lead.js";
import User from "../models/user.js";
import StatusLog from "../models/statusLog.js";


export const singleleads = async(req,res,next)=>{
    console.log("singlesales working")
    const userId = req.user?.id;
    console.log("user by singlesales",userId)
    try {
        if (req.user.role !== 'sales') {
          return res.status(403).json({ message: 'Access denied' });
        }
    
        const leads = await Lead.find({ salesPerson: req.user.id }).sort({ createdAt: -1 });    
        res.json(leads);
      } catch (error) {
        console.error('Error fetching sales leads:', error);
        res.status(500).json({ message: 'Server error' });
      }
}


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