// Admin console. Every route is gated by requireUser -> requireAdmin, and every
// handler runs on the service-role client (there are no admin RLS policies). The
// two guards ARE the security boundary — never remove them.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';
import * as admin from '../controllers/admin.controller.js';

const router = Router();

router.use(requireUser, requireAdmin);

// Platform overview
router.get('/overview', asyncHandler(admin.overview));

// Restaurants: approval queue + status control
router.get('/restaurants', asyncHandler(admin.listRestaurants));
router.post('/restaurants/:id/status', asyncHandler(admin.setRestaurantStatus));

// Users: roles + verification
router.get('/users', asyncHandler(admin.listUsers));
router.patch('/users/:id', asyncHandler(admin.updateUser));

// Offers: flag moderation
router.get('/offers/flagged', asyncHandler(admin.listFlaggedOffers));
router.post('/offers/:id/moderate', asyncHandler(admin.moderateOffer));
router.delete('/offers/:id', asyncHandler(admin.deleteOffer));

// Reviews: moderation
router.get('/reviews', asyncHandler(admin.listReviews));
router.delete('/reviews/:id', asyncHandler(admin.deleteReview));

export default router;
