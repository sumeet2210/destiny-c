// Profile-view logger. Anonymous-friendly, so optionalUser stamps a viewer_id
// only when a valid token happens to be present.
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { optionalUser } from '../middleware/auth.js';
import * as views from '../controllers/views.controller.js';

const router = Router();

router.post('/', optionalUser, asyncHandler(views.logView));

export default router;
