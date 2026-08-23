// Bookings. Students create/list/view/confirm/cancel their own; owners
// respond/annotate. Per-route guards keep the two roles' surfaces distinct.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent, requireOwner } from '../middleware/auth.js';
import * as bookings from '../controllers/bookings.controller.js';

const router = Router();

// Student
router.post('/', requireUser, requireStudent, asyncHandler(bookings.create));
router.get('/', requireUser, requireStudent, asyncHandler(bookings.listMine));
router.get('/:id', requireUser, requireStudent, asyncHandler(bookings.getOne));
router.post('/:id/confirm', requireUser, requireStudent, asyncHandler(bookings.confirm));
router.post('/:id/cancel', requireUser, requireStudent, asyncHandler(bookings.cancel));

// Owner
router.post('/:id/respond', requireUser, requireOwner, asyncHandler(bookings.respond));
router.patch('/:id/note', requireUser, requireOwner, asyncHandler(bookings.note));

export default router;
