import express from 'express'
import { io, server, app } from './socket.js';
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
import orderroutes from './routes/orderroutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const FRONTEND_URL = 'http://localhost:5173';

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Middleware to parse JSON and cookies
app.use(express.json());
app.use(cookieParser());

// Using routes
app.use('/Lead', leadroutes);
app.use('/Admin', dashboardrotes);
app.use('/Auth', authroutes);
app.use('/Sales', sindashroutes);
app.use('/User', userroutes);
app.use('/Order', orderroutes);
app.use('/Notification', notificationRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('Error occurred', err));

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});