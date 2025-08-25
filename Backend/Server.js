import express from 'express';
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
import litireplaceroutes from './routes/litireplaceroutes.js';
import orderroutes from './routes/orderroutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
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

// New webhook route for Zapier
app.post('/webhook/lead', async (req, res) => {
  try {
    // Assuming createleads is imported or available; adjust if needed
    const { createleads } = await import('./controllers/leadcontrollers.js');
    await createleads(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

// Using routes
app.use('/Lead', leadroutes);
app.use('/Admin', dashboardrotes);
app.use('/Auth', authroutes);
app.use('/Sales', sindashroutes);
app.use('/User', userroutes);
app.use('/Order', orderroutes);
app.use('/Notification', notificationRoutes);
app.use('/LiteReplace', litireplaceroutes);
app.use('/Procurement', procurementRoutes);

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
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error occurred', err));

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});