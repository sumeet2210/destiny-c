// Offers ticker (public) + flag (anon-friendly, so optionalUser).
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { optionalUser } from '../middleware/auth.js';
import * as offers from '../controllers/offers.controller.js';

const router = Router();

router.get('/ticker', asyncHandler(offers.ticker));
router.post('/:id/flag', optionalUser, asyncHandler(offers.flag));

export default router;
