import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

//importingroutes
import leadroutes from './routes/leadroutes.js';
import dashboardrotes from './routes/dashboardroute.js';
import authroutes from './routes/authroutes.js'

dotenv.config();

const app = express();
const FRONTEND_URL = "http://localhost:5173";
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, 
}));
app.use(express.json());

//using routes
app.use('/Lead',leadroutes);//leadsarea
app.use('/Admin',dashboardrotes)//dashboard
app.use('/Auth',authroutes);//authentication routes

const port = process.env.port || 5000
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('mongodb connected'))
  .catch(err => console.log('error occured', err))

app.listen(port, () => {
  console.log(`server running on port ${port}`)
})
