import Request from "../models/request.js";
import OfferApplication from "../models/offerApplication.js";

// Helper function to check and auto-complete past due jobs
const checkAndCompleteJobs = async () => {
  try {
    const now = new Date();
    
    // Find all accepted jobs that should be completed
    const acceptedJobs = await Request.find({ 
      status: 'accepted',
      date: { $lte: now } // Job date is today or in the past
    });
    
    const jobsToComplete = [];
    
    for (let job of acceptedJobs) {
      const jobDate = new Date(job.date);
      const [endHour, endMinute] = job.endTime.split(':').map(Number);
      jobDate.setHours(endHour, endMinute, 0, 0);
      
      // If current time is past the job's end time
      if (now > jobDate) {
        jobsToComplete.push(job._id);
      }
    }
    
    if (jobsToComplete.length > 0) {
      await Request.updateMany(
        { _id: { $in: jobsToComplete } },
        { 
          status: 'completed',
          completedAt: new Date()
        }
      );
      
      console.log(`Auto-completed ${jobsToComplete.length} past due jobs`);
    }
  } catch (error) {
    console.error('Error in auto-completing jobs:', error);
  }
};

// Get all requests for a specific cleaner
export async function getRequestsForCleaner(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const { cleanerId } = req.params;
    
    // Get direct requests to this cleaner (excluding completed ones)
    const directRequests = await Request.find({ 
      cleaner: cleanerId,
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('client', 'name email phoneNumber address')
    .sort({ createdAt: -1 });

    // Get applied offers (general requests where cleaner has applied)
    const appliedOffers = await OfferApplication.find({ 
      cleaner: cleanerId,
      status: 'pending'
    })
    .populate({
      path: 'offer',
      match: { status: 'open' }, // Only get offers that are still open
      populate: {
        path: 'client',
        select: 'name email phoneNumber address'
      }
    });

    // Filter out null offers (where the offer is no longer open)
    const validAppliedOffers = appliedOffers.filter(app => app.offer !== null);

    // Transform applied offers to match request structure
    const transformedOffers = validAppliedOffers.map(app => ({
      ...app.offer.toObject(),
      status: 'pending',
      requestType: 'general',
      applicationId: app._id,
      isApplied: true
    }));

    // Combine and sort all requests
    const allRequests = [...directRequests, ...transformedOffers]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allRequests);
  } catch (err) {
    console.error('Error fetching cleaner requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all general requests (open to all cleaners)
export async function getGeneralRequests(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const now = new Date();
    
    const requests = await Request.find({ 
      requestType: 'general',
      status: 'open',
      // Only show requests that haven't passed their deadline or job time
      $or: [
        { deadline: { $gte: now } }, // Deadline hasn't passed
        { deadline: null }, // No deadline set
        { 
          // Job hasn't started yet
          $expr: {
            $gt: [
              {
                $dateFromParts: {
                  year: { $year: '$date' },
                  month: { $month: '$date' },
                  day: { $dayOfMonth: '$date' },
                  hour: { $toInt: { $substr: ['$startTime', 0, 2] } },
                  minute: { $toInt: { $substr: ['$startTime', 3, 2] } }
                }
              },
              now
            ]
          }
        }
      ]
    })
    .populate('client', 'name email phoneNumber address')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching general requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update request status (accept/decline)
export async function updateRequestStatus(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const { requestId } = req.params;
    const { status } = req.body;
    const cleanerId = req.user.id;

    // Validate status
    if (!['accepted', 'declined', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if cleaner is authorized to update this request
    if (request.cleaner.toString() !== cleanerId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    // Don't allow status changes for already completed requests
    if (request.status === 'completed') {
      return res.status(400).json({ message: 'Cannot modify completed requests' });
    }

    request.status = status;
    if (status === 'accepted') {
      request.acceptedAt = new Date();
    } else if (status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();

    const populatedRequest = await Request.findById(requestId)
      .populate('client', 'name email phoneNumber');

    res.json(populatedRequest);
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Apply to a general request (create offer application)
export async function applyToOffer(req, res) {
  try {
    const { requestId } = req.params;
    const cleanerId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if it's a general request and still open
    if (request.requestType !== 'general' || request.status !== 'open') {
      return res.status(400).json({ message: 'Offer is no longer available' });
    }

    const now = new Date();
    
    // Check if deadline has passed
    if (request.deadline && new Date(request.deadline) < now) {
      return res.status(400).json({ message: 'Offer deadline has passed' });
    }

    // Check if the job time has already passed
    const jobDate = new Date(request.date);
    const [startHour, startMinute] = request.startTime.split(':').map(Number);
    jobDate.setHours(startHour, startMinute, 0, 0);
    
    if (now > jobDate) {
      return res.status(400).json({ message: 'Job time has already passed' });
    }

    // Check if cleaner has already applied
    const existingApplication = await OfferApplication.findOne({
      offer: requestId,
      cleaner: cleanerId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this offer' });
    }

    // Create offer application
    const application = new OfferApplication({
      offer: requestId,
      cleaner: cleanerId
    });

    await application.save();

    const populatedApplication = await OfferApplication.findById(application._id)
      .populate('cleaner', 'name email hourlyPrice service stars');

    res.json(populatedApplication);
  } catch (err) {
    console.error('Error applying to offer:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this offer' });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Get completed jobs for a cleaner
export async function getCompletedJobs(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const { cleanerId } = req.params;
    
    const jobs = await Request.find({ 
      cleaner: cleanerId,
      status: 'completed'
    })
    .populate('client', 'name email phoneNumber address')
    .sort({ completedAt: -1, updatedAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Error fetching completed jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get completed jobs for a client
export async function getCompletedJobsForClient(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const { clientId } = req.params;
    
    const jobs = await Request.find({
      client: clientId,
      status: 'completed'
    })
    .populate('cleaner', 'name email hourlyPrice service stars')
    .sort({ completedAt: -1, updatedAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Error fetching client completed jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Client rates a completed request
export async function rateRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { rating, review } = req.body;
    const clientId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Compare the client ObjectId directly with the user id
    if (request.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Not authorized to rate this request' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed requests can be rated' });
    }

    request.rating = rating;
    if (review && typeof review === 'string') {
      request.review = review;
    }
    request.clientRated = true;
    await request.save();

    const populated = await Request.findById(requestId)
      .populate('client', 'name email phoneNumber address')
      .populate('cleaner', 'name email hourlyPrice service stars');

    res.json(populated);
  } catch (err) {
    console.error('Error rating request:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Create a new request (for clients)
export async function createRequest(req, res) {
  try {
    const {
      cleanerId,
      service,
      date,
      startTime,
      endTime,
      note,
      requestType = 'specific',
      budget,
      deadline
    } = req.body;

    const clientId = req.user.id;

    // Validation
    if (!service || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate that the request is for a future time
    const now = new Date();
    const requestDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    requestDate.setHours(startHour, startMinute, 0, 0);
    
    if (requestDate <= now) {
      return res.status(400).json({ message: 'Cannot create requests for past times' });
    }

    // For specific requests, cleanerId is required
    if (requestType === 'specific' && !cleanerId) {
      return res.status(400).json({ message: 'Cleaner ID is required for specific requests' });
    }

    const requestData = {
      client: clientId,
      service,
      date,
      startTime,
      endTime,
      note,
      requestType,
      status: requestType === 'general' ? 'open' : 'pending'
    };

    if (requestType === 'specific') {
      requestData.cleaner = cleanerId;
    }

    if (requestType === 'general') {
      if (budget) {
        requestData.budget = budget;
      }
      if (deadline) {
        requestData.deadline = deadline;
      }
    }

    const request = new Request(requestData);
    await request.save();

    const populatedRequest = await Request.findById(request._id)
      .populate('client', 'name email phoneNumber')
      .populate('cleaner', 'name email');

    res.status(201).json(populatedRequest);
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get pending offers for a client (offers with applications)
export async function getPendingOffers(req, res) {
  try {
    // First, check and complete any past due jobs
    await checkAndCompleteJobs();
    
    const clientId = req.user.id;

    const offers = await Request.find({
      client: clientId,
      requestType: 'general',
      status: 'open'
    })
    .populate('client', 'name email phoneNumber address')
    .sort({ createdAt: -1 });

    // Get applications for each offer
    const offersWithApplications = await Promise.all(
      offers.map(async (offer) => {
        const applications = await OfferApplication.find({
          offer: offer._id,
          status: 'pending'
        }).populate('cleaner', 'name email hourlyPrice service stars age gender');

        return {
          ...offer.toObject(),
          applications
        };
      })
    );

    res.json(offersWithApplications);
  } catch (err) {
    console.error('Error fetching pending offers:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Select a cleaner for an offer
export async function selectCleanerForOffer(req, res) {
  try {
    const { requestId, applicationId } = req.params;
    const clientId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if client owns this offer
    if (request.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Not authorized to select cleaner for this offer' });
    }

    const application = await OfferApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if application belongs to this offer
    if (application.offer.toString() !== requestId) {
      return res.status(400).json({ message: 'Invalid application for this offer' });
    }

    // Update the request to assign the selected cleaner
    request.cleaner = application.cleaner;
    request.status = 'accepted';
    request.acceptedAt = new Date();
    request.requestType = 'specific';

    // Update all applications for this offer
    await OfferApplication.updateMany(
      { offer: requestId },
      { status: 'rejected' }
    );

    // Mark the selected application as selected
    application.status = 'selected';
    application.selectedAt = new Date();

    await Promise.all([request.save(), application.save()]);

    const populatedRequest = await Request.findById(requestId)
      .populate('client', 'name email phoneNumber address')
      .populate('cleaner', 'name email hourlyPrice service stars');

    res.json(populatedRequest);
  } catch (err) {
    console.error('Error selecting cleaner for offer:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Export the auto-completion function for use in other parts of the app
export { checkAndCompleteJobs };