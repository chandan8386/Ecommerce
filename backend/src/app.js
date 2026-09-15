import compression from 'compression';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env.js';
import { razorpayWebhook } from './controllers/payment.controller.js';
import { sitemap } from './controllers/seo.controller.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import { UPLOAD_ROOT } from './services/storage.service.js';
import { ApiError } from './utils/ApiError.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Storefront and admin run on other origins and need to load uploaded images.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        cb(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    })
  );

  // Razorpay webhook needs the raw body for signature verification, so it's registered before express.json().
  app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(
    '/uploads',
    express.static(UPLOAD_ROOT, {
      maxAge: '30d',
      immutable: true,
      setHeaders: (res) => res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'"),
    })
  );

  app.get('/sitemap.xml', sitemap);
  app.get('/', (_req, res) => res.json({ success: true, name: 'Aurum Jewelry API', docs: '/api/health' }));

  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
