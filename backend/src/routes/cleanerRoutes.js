import express from 'express';
import {
  createCleaner,
  getAllCleanersForDashboard,
  getCleanerByID,
  filterCleaners,
  loginCleaner,
  getMyProfile,
  updateMyProfile
} from '../controllers/cleanerController.js';
import { protect, roleProtect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/cleaners', createCleaner);
router.post('/cleaners/login', loginCleaner);
router.get('/cleaners', getAllCleanersForDashboard);
router.post('/cleaners/filter', filterCleaners);
router.get('/cleaners/:id', getCleanerByID);

// Profile routes (for authenticated cleaner)
router.get('/profile/cleaner', protect, roleProtect('cleaner'), getMyProfile);
router.put('/profile/cleaner', protect, roleProtect('cleaner'), updateMyProfile);

export default router;