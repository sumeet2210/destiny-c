// Search reads (public).
import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as search from '../controllers/search.controller.js';

const router = Router();

router.get('/index', asyncHandler(search.index));
router.get('/dishes', asyncHandler(search.dishes));

export default router;
