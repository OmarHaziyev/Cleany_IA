import express from "express";
import { 
  createClient, 
  loginClient,
  getMyProfile,
  updateMyProfile
} from "../controllers/clientController.js";
import { protect, roleProtect } from '../middleware/auth.js';

const clientRouter = express.Router();

// Public routes
clientRouter.post('/clients', createClient);
clientRouter.post('/clients/login', loginClient);

// Profile routes (for authenticated client)
clientRouter.get('/profile/client', protect, roleProtect('client'), getMyProfile);
clientRouter.put('/profile/client', protect, roleProtect('client'), updateMyProfile);

export default clientRouter;