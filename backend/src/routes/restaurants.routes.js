// Public catalog reads + the student save-toggle (which lives under a restaurant
// id, so it's mounted here rather than under /social).
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent } from '../middleware/auth.js';
import * as restaurants from '../controllers/restaurants.controller.js';
import * as social from '../controllers/social.controller.js';

const router = Router();

router.get('/', asyncHandler(restaurants.list));
router.get('/:id', asyncHandler(restaurants.detail));
router.get('/:id/also-like', asyncHandler(restaurants.alsoLikeHandler));
router.post('/:id/save', requireUser, requireStudent, asyncHandler(social.toggleSave));

export default router;
