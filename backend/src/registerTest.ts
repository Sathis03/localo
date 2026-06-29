import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Agency, User } from './models';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localrankpro';

const testRegister = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    const email = 'testuser@example.com';
    const password = 'password123';
    const name = 'Test User';
    const role = 'Agency Owner';
    const agencyName = 'Test Agency';

    // Clear existing test user if any
    await User.deleteMany({ email });
    await Agency.deleteMany({ name: agencyName });

    const passwordHash = await bcrypt.hash(password, 10);

    const newAgency = await Agency.create({
      name: agencyName,
      ownerId: new mongoose.Types.ObjectId(),
      settings: { themeColor: '#3b82f6' }
    });

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      agencyId: newAgency._id,
      status: 'Active'
    });

    await Agency.findByIdAndUpdate(newAgency._id, { ownerId: newUser._id });

    console.log('Registration simulated successfully. User created:', newUser);
    process.exit(0);
  } catch (error) {
    console.error('Registration failed with error:', error);
    process.exit(1);
  }
};

testRegister();
