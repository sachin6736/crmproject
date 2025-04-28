import Lead from "../../models/lead.js";
import User from "../../models/user.js";

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
        const team = await User.find({}, "name email role isPaused createdAt")
        //console.log("my team",team)
        res.status(200).json(team)
    } catch (error) {
        console.log("error in getting team",error)
        res.status(500).json({error:"an error occured"})
    }
}
