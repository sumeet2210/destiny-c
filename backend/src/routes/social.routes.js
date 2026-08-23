// Social: saved list, friends, RSVP list, friend activity. Every route is
// student-only, so the guards are applied once at the router level.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent } from '../middleware/auth.js';
import * as social from '../controllers/social.controller.js';

const router = Router();

router.use(requireUser, requireStudent);

router.get('/saved', asyncHandler(social.savedList));
router.get('/friends', asyncHandler(social.friends));
router.post('/friends', asyncHandler(social.addFriend));
router.post('/friends/:id/respond', asyncHandler(social.respondFriend));
router.delete('/friends/:id', asyncHandler(social.removeFriend));
router.get('/rsvps', asyncHandler(social.rsvps));
router.get('/friend-activity', asyncHandler(social.friendActivity));

export default router;
