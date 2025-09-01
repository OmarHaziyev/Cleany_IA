import express from 'express';
import {
  createCleaner,
  getAllCleanersForDashboard,
  getCleanerByID,
  updateCleaner,
  deleteCleaner,
  filterCleaners,
  loginCleaner
} from '../controllers/cleanerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/cleaners', createCleaner);
router.post('/cleaners/login', loginCleaner);
router.get('/cleaners', getAllCleanersForDashboard);
router.post('/cleaners/filter', filterCleaners); // Fixed: should be POST for filter with body
router.get('/cleaners/:id', getCleanerByID);

// Protected routes (authentication required)
router.put('/cleaners/:id', protect, updateCleaner);
router.delete('/cleaners/:id', protect, deleteCleaner);

export default router;