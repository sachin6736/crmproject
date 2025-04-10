import Lead from "../models/lead.js";

export const getleadcount= async (req,res,next)=>{
    console.log("getleadcountworking")
    try {
        const leadcount = await Lead.countDocuments();
        console.log("leadcounts",leadcount)
        res.status(200).json({leadcount})
    } catch (error) {
        console.log("error in getsingle",error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getcountbystatus = async(req,res,next)=>{
    console.log("countbystatus worrking")
    try {
        const statuscount = await Lead.aggregate([
            {$group: {_id: "$status", count: {$sum :1}}}
        ])
        console.log("statuscount",statuscount)
        res.status(200).json(statuscount)
    } catch (error) {
        console.log("error",error)
        res.status(500).json({error: "internal server error"})
    }
}