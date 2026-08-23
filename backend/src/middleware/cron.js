// Guards POST /cron/:job. Same contract as the Next route: Bearer must equal
// CRON_SECRET. The cron controller is the only place that uses the admin client.
import { env } from '../config/index.js';
import { HttpError } from './error.js';

export function requireCronSecret(req, res, next) {
  const auth = req.headers.authorization;
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return next(new HttpError(401, 'unauthorized'));
  }
  next();
}
