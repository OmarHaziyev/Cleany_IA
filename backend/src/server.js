import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {connectDB} from "./config/db.js"; 
import router from "./routes/cleanerRoutes.js";
import clientRouter from "./routes/clientRoutes.js";
import requestRouter from "./routes/requestRoutes.js";
import jobScheduler from "./config/jobScheduler.js";

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

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  
  // Stop the job scheduler
  jobScheduler.stop();
  
  // Close server
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// DB connection and server start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
    
    // Start the job scheduler after server is running
    jobScheduler.start(5); // Check every 5 minutes
    
    console.log("Job scheduler started - will check for past due jobs every 5 minutes");
  });
}).catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exit(1);
});
