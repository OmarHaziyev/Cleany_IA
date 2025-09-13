import { checkAndCompleteJobs } from '../controllers/requestController.js';

class JobScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  // Start the scheduler to check for past due jobs every 5 minutes
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('Job scheduler is already running');
      return;
    }

    console.log(`Starting job scheduler - checking every ${intervalMinutes} minutes`);
    
    // Run immediately on start
    this.checkJobs();
    
    // Then run every intervalMinutes
    this.intervalId = setInterval(() => {
      this.checkJobs();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('Job scheduler stopped');
    }
  }

  // Check for past due jobs
  async checkJobs() {
    try {
      console.log(`[${new Date().toISOString()}] Checking for past due jobs...`);
      await checkAndCompleteJobs();
    } catch (error) {
      console.error('Error in scheduled job check:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// Create and export a singleton instance
const jobScheduler = new JobScheduler();
export default jobScheduler;