// Auth: token issue/verify/refresh are public; me/profile need a session.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireUser, requireStudent } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/student/otp', asyncHandler(auth.studentOtp));
router.post('/student/verify', asyncHandler(auth.studentVerify));
router.post('/owner/login', asyncHandler(auth.ownerLogin));
router.post('/owner/signup', asyncHandler(auth.ownerSignup));
router.post('/refresh', asyncHandler(auth.refresh));
router.post('/logout', asyncHandler(auth.logout));
router.get('/me', requireUser, asyncHandler(auth.me));
router.patch('/profile', requireUser, requireStudent, asyncHandler(auth.updateProfile));

export default router;
