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
  getPendingRequests,
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
router.get('/requests/client/pending', protect, roleProtect('client'), getPendingRequests);
router.post('/offers/:requestId/select/:applicationId', protect, roleProtect('client'), selectCleanerForOffer);

// Cleaner routes (protected)
router.get('/requests/cleaner/:cleanerId', getRequestsForCleaner);
router.get('/requests/general', protect, roleProtect('cleaner'), getGeneralRequests);
router.put('/requests/:requestId', protect, roleProtect('cleaner'), updateRequestStatus);
router.post('/requests/general/:requestId/apply', protect, roleProtect('cleaner'), applyToOffer);
router.get('/jobs/cleaner/:cleanerId/completed', protect, roleProtect('cleaner'), getCompletedJobs);



export default router;