import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/apiRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For development. Real apps should restrict origins.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Parse JSON Bodies
app.use(express.json());

// API Base Routes
app.use('/api/v1', apiRoutes);

// Base Status Endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'Online', service: 'LocalRank Pro API' });
});

// Error handling middleware
app.use(errorHandler);

export default app;
