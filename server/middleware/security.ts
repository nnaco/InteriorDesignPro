import cors from 'cors';
import helmet from 'helmet';
import type { Express } from 'express';
import { createRateLimit } from './errorHandler';

export const setupSecurity = (app: Express) => {
  // Helmet for security headers - disabled in development to avoid conflicts with Vite
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://fonts.googleapis.com',
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );
  } else {
    // Minimal helmet config for development
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: false,
      })
    );
  }

  // CORS configuration - more permissive in development
  const corsOptions = {
    origin:
      process.env.NODE_ENV === 'development'
        ? true
        : (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
          ) => {
            // Allow requests with no origin (mobile apps, curl requests, etc.)
            if (!origin) return callback(null, true);

            if (
              origin.includes(process.env.APP_URL || 'http://localhost:5001')
            ) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.use(cors(corsOptions));

  // Rate limiting - only in production
  if (process.env.NODE_ENV === 'production') {
    const generalLimiter = createRateLimit(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes
    const authLimiter = createRateLimit(15 * 60 * 1000, 10); // 10 auth attempts per 15 minutes
    const apiLimiter = createRateLimit(15 * 60 * 1000, 300); // 300 API calls per 15 minutes

    app.use('/', generalLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/callback', authLimiter);
    app.use('/api', apiLimiter);
  }

  // Security middleware for file uploads
  app.use((req, res, next) => {
    // Prevent path traversal attacks
    if (req.path.includes('../') || req.path.includes('..\\')) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }
    next();
  });
};

// Input sanitization
import validator from 'validator';

export const sanitizeInput = {
  email: (email: string): string => {
    return validator.normalizeEmail(email) || '';
  },

  text: (text: string): string => {
    return validator.escape(text);
  },

  filename: (filename: string): string => {
    // Remove potentially dangerous characters
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  },

  url: (url: string): string => {
    return validator.isURL(url) ? url : '';
  },
};
