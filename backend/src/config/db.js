import mongoose from 'mongoose';
import { config } from './env.js';

let mongod = null;

export const connectDB = async () => {
  try {
    if (config.MONGODB_URI && config.MONGODB_URI.startsWith('mongodb')) {
      console.log('Connecting to MongoDB Atlas / configured URI...');
      await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB successfully connected.');
      return;
    }

    // In-memory fallback for local dev / testing if no cloud URI provided
    console.log('No MONGODB_URI configured. Starting embedded in-memory MongoDB for local testing...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Embedded MongoDB Memory Server connected successfully.');
  } catch (error) {
    console.warn('MongoDB connection warning:', error.message);
    console.warn('Will retry or use fallback database mode.');
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error disconnecting from DB:', err.message);
  }
};

