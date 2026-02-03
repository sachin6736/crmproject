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
    console.log("name:", name);
    console.log("email:", email);
    console.log("role:", role);

    const allowedRoles = ["admin", "sales", "customer_relations", "procurement", "viewer"];

    if (!name || !email || !role || !allowedRoles.includes(role)) {
      return res.status(400).json({ 
        message: "Name, email, and valid role are required." 
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Generate simple password (no hashing)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const plainPassword = `equivise${randomDigits}`;

    const newUser = new User({
      name,
      email,
      password: plainPassword,        // ← stored in plain text (as requested)
      role,
      status: "LoggedOut",
    });

    await newUser.save();

    console.log("Created user:", {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: newUser.password,     // logged for admin/debug
      status: newUser.status
    });

    console.log(`User created: ${email} with role ${role}, status: ${newUser.status}`);

    // Return the user + plain password so admin can see/copy it
    // (Never do this in production if security matters — but per your request)
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      generatedPassword: plainPassword,  // ← only way admin gets the password
      message: "User created successfully. Password is shown below (copy it manually)."
    });

  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Direct plain-text comparison (NO bcrypt)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update status to Available
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { status: "Available" },
      { new: true }
    ).select("name email role status");

    // Log status change
    const statusLog = new StatusLog({
      userId: user._id,
      status: "Available",
      timestamp: new Date(),
    });
    await statusLog.save();

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        status: "Available", 
        Access: user.Access 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,           // Must be true in production with HTTPS
        sameSite: "none",       // Required for cross-origin
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        message: "Login successful",
        user: { 
          name: updatedUser.name, 
          email: updatedUser.email, 
          role: updatedUser.role, 
          status: updatedUser.status 
        },
      });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login", error: error.message });
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