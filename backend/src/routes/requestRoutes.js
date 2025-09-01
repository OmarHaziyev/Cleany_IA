import express from 'express';
import {
  getRequestsForCleaner,
  getGeneralRequests,
  updateRequestStatus,
  applyToOffer,
  getCompletedJobs,
  createRequest,
  getCompletedJobsForClient,
  rateRequest,
  getPendingOffers,
  selectCleanerForOffer
} from '../controllers/requestController.js';
import { protect, roleProtect } from '../middleware/auth.js';

const router = express.Router();

// Client routes (protected)
router.post('/requests', protect, createRequest);
router.get('/jobs/client/:clientId/completed', protect, roleProtect('client'), getCompletedJobsForClient);
router.put('/requests/:requestId/rate', protect, roleProtect('client'), rateRequest);
router.get('/offers/pending', protect, roleProtect('client'), getPendingOffers);
router.post('/offers/:requestId/select/:applicationId', protect, roleProtect('client'), selectCleanerForOffer);

// Cleaner routes (protected)
router.get('/requests/cleaner/:cleanerId', protect, roleProtect('cleaner'), getRequestsForCleaner);
router.get('/requests/general', protect, roleProtect('cleaner'), getGeneralRequests);
router.put('/requests/:requestId', protect, roleProtect('cleaner'), updateRequestStatus);
router.post('/requests/general/:requestId/apply', protect, roleProtect('cleaner'), applyToOffer);
router.get('/jobs/cleaner/:cleanerId/completed', protect, roleProtect('cleaner'), getCompletedJobs);

// Admin routes (if needed later)
router.get('/requests', protect, async (req, res) => {
  // Get all requests (admin only)
  try {
    const requests = await Request.find()
      .populate('client', 'name email')
      .populate('cleaner', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;