// Express app factory. server.js listens; supertest imports createApp directly.
import express from 'express';
import cors from 'cors';
import { env } from './config/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurants.routes.js';
import offerRoutes from './routes/offers.routes.js';
import searchRoutes from './routes/search.routes.js';
import eventRoutes from './routes/events.routes.js';
import bookingRoutes from './routes/bookings.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import socialRoutes from './routes/social.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import adminRoutes from './routes/admin.routes.js';
import viewRoutes from './routes/views.routes.js';
import cronRoutes from './routes/cron.routes.js';

export function createApp() {
  const app = express();

  const allowedOrigins = env.ALLOWED_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) =>
    res.json({ ok: true, service: 'destiny-backend' }),
  );

  // Domain routers.
  app.use('/auth', authRoutes);
  app.use('/restaurants', restaurantRoutes);
  app.use('/offers', offerRoutes);
  app.use('/search', searchRoutes);
  app.use('/events', eventRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/social', socialRoutes);
  app.use('/owner', ownerRoutes);
  app.use('/admin', adminRoutes);
  app.use('/views', viewRoutes);
  app.use('/cron', cronRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
