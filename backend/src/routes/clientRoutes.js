import express from "express";
import { 
  createClient, 
  getAllClients, 
  getClientByID, 
  deleteClient, 
  updateClient, 
  loginClient,
  getMyProfile,
  updateMyProfile
} from "../controllers/clientController.js";
import { protect, roleProtect } from '../middleware/auth.js';

const clientRouter = express.Router();

// Public routes
clientRouter.post('/clients', createClient);
clientRouter.post('/clients/login', loginClient);

// Admin routes (if needed)
clientRouter.get("/clients", getAllClients);
clientRouter.get("/clients/:id", getClientByID);
clientRouter.delete("/clients/:id", deleteClient);
clientRouter.put("/clients/:id", updateClient);

// Profile routes (for authenticated client)
clientRouter.get('/profile/client', protect, roleProtect('client'), getMyProfile);
clientRouter.put('/profile/client', protect, roleProtect('client'), updateMyProfile);

export default clientRouter;