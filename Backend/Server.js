import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

//importingroutes
import leadroutes from './routes/leadroutes.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//using routes
app.use('/Lead',leadroutes)

const port = process.env.port || 5000
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('mongodb connected'))
  .catch(err => console.log('error occured', err))

app.listen(port, () => {
  console.log(`server running on port ${port}`)
})
