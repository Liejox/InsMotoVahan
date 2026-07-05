import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import { errorHandler } from './middlewares/error';
import { logger } from './utils/logger';

import { apiLimiter } from './middlewares/rateLimiter';

const app = express();

// 1. Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = config.ALLOWED_ORIGINS.split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Apply API Rate Limiter
app.use('/api', apiLimiter);

// 2. Request Parsing Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Logger Middleware
const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve the hero profile image statically
app.use('/hero-image', express.static(config.HERO_IMAGE_DIR));

// 5. Global Error Handling
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info(`🚀 CRM Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});
