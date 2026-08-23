// Event reads (public) + the student RSVP toggle. `/interest-counts` MUST be
// declared before `/:id`, or Express would treat "interest-counts" as an id.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent } from '../middleware/auth.js';
import * as events from '../controllers/events.controller.js';
import * as social from '../controllers/social.controller.js';

const router = Router();

router.get('/', asyncHandler(events.list));
router.get('/interest-counts', asyncHandler(events.interestCounts));
router.get('/:id', asyncHandler(events.detail));
router.post('/:id/rsvp', requireUser, requireStudent, asyncHandler(social.toggleRsvp));

export default router;
