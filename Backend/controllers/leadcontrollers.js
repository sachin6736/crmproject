import Lead from "../models/lead.js";

export const createleads = async (req,res,next)=>{
    console.log("lead creation working");
    const {clientName,phoneNumber,email,zip,partRequested,make,model,year,trim,} = req.body;
    if(!clientName||!phoneNumber||!email||!zip||!partRequested||!make||!model||!year||!trim){
        res.status(401).json('all fields are necessary')
    }else{
        const newLead = new Lead({
            clientName: clientName,
            phoneNumber: phoneNumber,
            email: email,
            zip: zip,
            partRequested: partRequested,
            make: make,
            model: model,
            year: year,
            trim: trim,
          });      
          try {
            await newLead.save();
            res.status(201).json("lead created succesfully")
          } catch (error) {
            console.log("an error occured",error)
          }
    }         
}

export const getleads = async(req,res,next)=>{
  console.log("getlist controller working")
  try {
    const leads = await Lead.find();
    res.status(200).json(leads)
  } catch (error) {
    console.log(error)
    res.status(500).json('error while fetching leads.')
  }
}