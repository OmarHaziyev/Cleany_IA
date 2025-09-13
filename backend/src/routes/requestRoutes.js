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
  selectCleanerForOffer,
  checkAndCompleteJobs
} from '../controllers/requestController.js';
import { protect, roleProtect } from '../middleware/auth.js';
import Request from '../models/request.js';

const router = express.Router();

// Client routes (protected)
router.post('/requests', protect, roleProtect('client'), createRequest);
router.get('/jobs/client/:clientId/completed', protect, roleProtect('client'), getCompletedJobsForClient);
router.put('/requests/:requestId/rate', protect, roleProtect('client'), rateRequest);
router.get('/offers/pending', protect, roleProtect('client'), getPendingOffers);
router.post('/offers/:requestId/select/:applicationId', protect, roleProtect('client'), selectCleanerForOffer);

// Cleaner routes (protected)
router.get('/requests/cleaner/:cleanerId', getRequestsForCleaner);
router.get('/requests/general', protect, roleProtect('cleaner'), getGeneralRequests);
router.put('/requests/:requestId', protect, roleProtect('cleaner'), updateRequestStatus);
router.post('/requests/general/:requestId/apply', protect, roleProtect('cleaner'), applyToOffer);
router.get('/jobs/cleaner/:cleanerId/completed', protect, roleProtect('cleaner'), getCompletedJobs);

// Manual job completion check endpoint (for testing/admin use)
router.post('/jobs/check-completion', protect, async (req, res) => {
  try {
    await checkAndCompleteJobs();
    res.json({ message: 'Job completion check completed successfully' });
  } catch (err) {
    console.error('Error in manual job completion check:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// Get request statistics (for admin dashboard)
router.get('/requests/stats', protect, async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalRequests = await Request.countDocuments();
    const completedToday = await Request.countDocuments({
      status: 'completed',
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    res.json({
      statusBreakdown: stats,
      totalRequests,
      completedToday
    });
  } catch (err) {
    console.error('Error fetching request stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;