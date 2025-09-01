import express from "express";
import { createClient, getAllClients, getClientByID, deleteClient, updateClient, loginClient } from "../controllers/clientController.js";
import { protect } from '../middleware/auth.js';
const clientRouter = express.Router();


clientRouter.post('/clients', createClient);
clientRouter.get("/clients", getAllClients);
clientRouter.get("/clients/:id", getClientByID);
clientRouter.delete("/clients/:id", deleteClient);
clientRouter.put("/clients/:id", updateClient);
clientRouter.post('/clients/login', loginClient);



export default clientRouter;




