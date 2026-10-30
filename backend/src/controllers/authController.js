import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { registerSchema, loginSchema } from '../validators/authSchemas.js';
import { logActivity } from '../models/ActivityLog.js';
import { seedSampleWorkspace } from '../utils/sampleData.js';

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const newUser = await User.create({
      name: validated.name,
      email: validated.email,
      passwordHash
    });

    // Auto-seed default sample workspace into MongoDB for new user
    let initialProject = null;
    try {
      const seedResult = await seedSampleWorkspace(newUser._id);
      initialProject = seedResult.project;
    } catch (seedErr) {
      console.warn('Initial project seeding warning:', seedErr.message);
    }

    // Record activity in MongoDB
    await logActivity({
      userId: newUser._id,
      projectId: initialProject?._id || null,
      action: 'USER_REGISTERED',
      title: 'Researcher Account Created',
      description: `Account registered for ${newUser.name} (${newUser.email}) and initialized in MongoDB.`
    });

    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully in MongoDB database.',
      token,
      user: newUser.toSafeObject(),
      initialProjectId: initialProject?._id || null
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Log login activity to MongoDB
    await logActivity({
      userId: user._id,
      action: 'USER_LOGIN',
      title: 'Researcher Signed In',
      description: `Active session authenticated for ${user.email}.`
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

