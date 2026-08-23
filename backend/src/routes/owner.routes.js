// Owner console: reads + all restaurant/menu/offer/event/photo mutations. Every
// route is owner-only. Photo upload is multipart, so multer parses it into
// req.file (in memory) before the controller re-checks the size.
import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { requireUser, requireOwner } from '../middleware/auth.js';
import * as owner from '../controllers/owner.controller.js';

const router = Router();

router.use(requireUser, requireOwner);

// Reads
router.get('/bundle', asyncHandler(owner.bundle));
router.get('/bookings', asyncHandler(owner.bookings));
router.get('/analytics', asyncHandler(owner.analytics));

// Restaurant profile
router.post('/restaurant', asyncHandler(owner.createRestaurant));
router.patch('/restaurant', asyncHandler(owner.updateRestaurant));

// Menu
router.post('/menu', asyncHandler(owner.upsertMenuItem));
router.delete('/menu/:id', asyncHandler(owner.deleteMenuItem));

// Offers
router.post('/offers', asyncHandler(owner.createOffer));
router.patch('/offers/:id', asyncHandler(owner.updateOffer));

// Events (upsert; 15-day window validated in the controller)
router.post('/events', asyncHandler(owner.upsertEvent));

// Photos. 8 MB hard cap at the parser; the controller enforces the real
// ~1.5 MB limit. Multer's own errors are remapped to our JSON envelope.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
const singleFile = (field) => (req, res, next) =>
  upload.single(field)(req, res, (err) =>
    err
      ? next(new HttpError(413, 'Image is too large even after resizing.'))
      : next(),
  );

router.post('/photos', singleFile('file'), asyncHandler(owner.uploadPhoto));
router.post('/photos/reorder', asyncHandler(owner.reorderPhotos));
router.delete('/photos/:id', asyncHandler(owner.deletePhoto));

export default router;
