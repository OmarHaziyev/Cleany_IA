import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {connectDB} from "./config/db.js"; 
import router from "./routes/cleanerRoutes.js";
import clientRouter from "./routes/clientRoutes.js";
import { protect } from './middleware/auth.js';
import requestRouter from "./routes/requestRoutes.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware

app.use(cors())
app.use(express.json());

// Routes
app.use("/api", router);
app.use("/api", requestRouter);
app.use("/api", clientRouter)

// DB connection and server start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
  });
});
