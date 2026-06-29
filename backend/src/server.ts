import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localrankpro';

console.log('Starting LocalRank Pro Backend...');

const startServer = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB Database.');
  } catch (error) {
    console.error('CRITICAL: MongoDB connection failed:', error);
    console.log('Falling back to Offline Local Sandbox Mode. Database mutations will be mock-simulated.');
  }

  app.listen(PORT, () => {
    console.log(`LocalRank Pro Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/status`);
  });
};

startServer();
