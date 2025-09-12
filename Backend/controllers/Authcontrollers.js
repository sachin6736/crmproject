import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StatusLog from "../models/statusLog.js";
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
} /// previuos signup logic when user was manully signing up

export const createuser = async (req, res, next) => {
  console.log("createuser working");
  
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { name, email, role } = req.body;
    console.log("name",name);
    console.log("email",email);
    console.log("role",role);
    
    const allowedRoles = ["admin", "sales", "customer_relations", "procurement","viewer"];
    if (!name || !email || !role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Name, email, and valid role are required." });
    }
    const existing = await User.findOne({ email: email });
    if (existing) {
      return res.status(409).json({ message: "User with email already exists." });
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const plainPassword = `equivise${randomDigits}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = new User({
      name,
      email,
      role,
      password: hashedPassword,
      status: "LoggedOut", // Explicitly set status to "LoggedOut"
    });
    await newUser.save();

    // Log the created user to verify the status
    console.log("Created user:", newUser);

    const subject = "Your Equivise CRM Account Details";
    const emailcontent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4A90E2;">Welcome to Equivise CRM 🚀</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been successfully created in the Equivise CRM system.</p>
        <p>Here are your login details:</p>
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Login Email:</strong> ${email}</li>
          <li><strong>Password:</strong> <span style="color: #d6336c;">${plainPassword}</span></li>
          <li><strong>Status:</strong> LoggedOut</li>
        </ul>
        <p>Need help? Feel free to reach out to our support team.</p>
        <br/>
        <p style="color: #888;">– The Equivise Team</p>
        <p style="font-size: 0.9em;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `;

    await sendEmail(email, subject, emailcontent);
    console.log(`User created: ${email} with role ${role}, status: ${newUser.status}`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { status: "Available" },
      { new: true }
    ).select("name email role status");

    const statusLog = new StatusLog({
      userId: user._id,
      status: "Available",
      timestamp: new Date(),
    });
    await statusLog.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, status: "Available", Access: user.Access },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
    .cookie("token", token, {
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      sameSite: "none", // Allow cross-origin cookie sending
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .status(200)
    .json({
      message: "Login successful",
      user: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, status: updatedUser.status },
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Error during login", error });
  }
};

export const logout = async (req, res, next) => {
  try {
    // Get user from token (if available) to update status
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, { status: 'LoggedOut' });
      const statusLog = new StatusLog({
        userId: decoded.id,
        status: 'LoggedOut',
        timestamp: new Date(),
      });
      await statusLog.save();
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // Match login's setting
      path: '/',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error });
  }
};