import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app';

const MONGODB_URI = process.env.MONGODB_URI;

// Cached connection promise to reuse connection across lambda invocations
let cachedConnection: Promise<typeof mongoose> | null = null;

const connectDb = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  if (!MONGODB_URI) {
    console.warn('WARNING: No MONGODB_URI environment variable defined.');
    return;
  }

  mongoose.set('strictQuery', true);
  cachedConnection = mongoose.connect(MONGODB_URI);
  
  try {
    await cachedConnection;
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    cachedConnection = null;
    console.error('CRITICAL: MongoDB connection failed:', error);
    throw error;
  }
};

// Vercel serverless function handler
export default async (req: any, res: any) => {
  try {
    await connectDb();
  } catch (error) {
    console.error('Serverless connection helper failed:', error);
  }
  
  // Forward to Express
  return app(req, res);
};
