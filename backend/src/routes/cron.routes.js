// Scheduled jobs. Guarded by the shared CRON_SECRET; the controller is the only
// caller of the admin (service-key) client.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireCronSecret } from '../middleware/cron.js';
import { runJob } from '../controllers/cron.controller.js';

const router = Router();

router.post('/:job', requireCronSecret, asyncHandler(runJob));

export default router;
