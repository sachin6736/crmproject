import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendEmail from "../sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET 

export const signup = async(req,res,next)=>{
    console.log("signup controller working")
    try {
        const {name,email,password} = req.body;
        const existing = await User.findOne({email})
        if(existing){
            return res.status(400).json({message: "user already exists"})
        }
        const hashed = await bcrypt.hash(password,10);
        const newuser = new User({
            name :name,
            email: email,
            password: hashed
        });
        await newuser.save();

        const token = jwt.sign(
            {id: newuser._id, name:newuser.name, role:newuser.role}, JWT_SECRET,{ expiresIn: '7d' }
        );
        res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(201)
      .json({ message: "User registered successfully", user: { name, email, role: newuser.role } });
    } catch (error) {
        console.log("error in sign up",error)
        res.status(500).json({message:"an error occurred during signup",error})
    }
} /// previos signup logic when user was manully signing up

export const createuser = async(req,res,next)=>{

  console.log("createuser working");
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied Admins only." });
    }
    const {name , email , role} = req.body;
    const existing = await User.findOne({email: email});
    if(existing){
      return res.status(409).json({message:"user already exists"})
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const plainPassword = `equivise${randomDigits}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = new User({
      name,
      email,
      role,
      password: hashedPassword,
    });
    await newUser.save();

  //   const subject = 'Your Equivise CRM Account Details';
  //   const emailcontent = `
  //   <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  //   <h2 style="color: #4A90E2;">Welcome to Equivise CRM 🚀</h2>

  //   <p>Hi <strong>${name}</strong>,</p>

  //   <p>Your account has been successfully created in the Equivise CRM system.</p>

  //   <p>Here are your login details:</p>
    
  //   <ul style="list-style: none; padding-left: 0;">
  //     <li><strong>Login Email:</strong> ${email}</li>
  //     <li><strong>Password:</strong> <span style="color: #d6336c;">${plainPassword}</span></li>
  //   </ul>

  //   <p>Need help? Feel free to reach out to our support team.</p>

  //   <br/>
  //   <p style="color: #888;">– The Equivise Team</p>
  //   <p style="font-size: 0.9em;">This is an automated message. Please do not reply directly to this email.</p>
  // </div>
  //   `;

  //   await sendEmail(email, subject, emailcontent);
    res.status(201).json(newUser);
  } catch (error) {
    console.log('Create user error:', error);  
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const login = async (req,res,next)=>{
    //console.log("login controller working")
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
        // Create JWT
        const token = jwt.sign(
          { id: user._id, name: user.name, role: user.role, status:user.status },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        // Send token in HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ message: "Login successful", user: { name: user.name, email: user.email, role: user.role,  } });
    
      } catch (error) {
        console.log("Error",error);
        res.status(500).json({ message: "Error during login", error });
      }
}

export const logout = async(req,res,next)=>{
    //console.log("logout working");
    try {
        res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
      } catch (error) {
        res.status(500).json({ message: "Logout failed", error });
      }
}