import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 

// Importing routes
import leadroutes from './routes/leadroutes.js';
import dashboardrotes from './routes/dashboardroute.js';
import authroutes from './routes/authroutes.js';
import sindashroutes from './routes/sindashroutes.js';
import userroutes from './routes/userroutes.js';
import orderroutes from './routes/orderroutes.js'


dotenv.config();

const app = express();
const FRONTEND_URL = "http://localhost:5173";

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Middleware to parse JSON and cookies
app.use(express.json());
app.use(cookieParser()); // <-- Add this line to parse cookies

// Using routes
app.use('/Lead', leadroutes); // Leads area
app.use('/Admin', dashboardrotes); // Dashboard
app.use('/Auth', authroutes); // Authentication routes
app.use('/Sales',sindashroutes); //salesperson dasboard
app.use('/User',userroutes);//userrotes
app.use('/Order',orderroutes);//orderroutes



const port = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('Error occurred', err));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
