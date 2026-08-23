// Reviews: students only, gated further to completed visits inside the controller.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent } from '../middleware/auth.js';
import * as reviews from '../controllers/reviews.controller.js';

const router = Router();

router.post('/', requireUser, requireStudent, asyncHandler(reviews.create));

export default router;
