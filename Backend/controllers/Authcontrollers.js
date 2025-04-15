import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
            {id: newuser._id, role:newuser.role}, JWT_SECRET,{ expiresIn: '7d' }
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
}

export const login = async (req,res,next)=>{
    console.log("login controller working")
    try {
        const { email, password } = req.body;
    
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
        // Create JWT
        const token = jwt.sign(
          { id: user._id, role: user.role },
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
          .json({ message: "Login successful", user: { name: user.name, email: user.email, role: user.role } });
    
      } catch (error) {
        console.log("Error",error);
        res.status(500).json({ message: "Error during login", error });
      }
}