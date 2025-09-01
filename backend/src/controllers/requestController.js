import Request from "../models/request.js";
import OfferApplication from "../models/offerApplication.js";

// Get all requests for a specific cleaner
export async function getRequestsForCleaner(req, res) {
  try {
    const { cleanerId } = req.params;
    
    const requests = await Request.find({ 
      cleaner: cleanerId,
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('client', 'name email phoneNumber address')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching cleaner requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all general requests (open to all cleaners)
export async function getGeneralRequests(req, res) {
  try {
    const requests = await Request.find({ 
      requestType: 'general',
      status: 'open'
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
    const { requestId } = req.params;
    const { status } = req.body;
    const cleanerId = req.user.id; // From auth middleware

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

    request.status = status;
    if (status === 'accepted') {
      request.acceptedAt = new Date();
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
    const cleanerId = req.user.id; // From auth middleware

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if it's a general request and still open
    if (request.requestType !== 'general' || request.status !== 'open') {
      return res.status(400).json({ message: 'Offer is no longer available' });
    }

    // Check if deadline has passed
    if (request.deadline && new Date() > new Date(request.deadline)) {
      return res.status(400).json({ message: 'Offer deadline has passed' });
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
    const { cleanerId } = req.params;
    
    const jobs = await Request.find({ 
      cleaner: cleanerId,
      status: 'completed'
    })
    .populate('client', 'name email phoneNumber')
    .sort({ updatedAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Error fetching completed jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get completed jobs for a client
export async function getCompletedJobsForClient(req, res) {
  try {
    const { clientId } = req.params;

    const jobs = await Request.find({
      client: clientId,
      status: 'completed'
    })
    .populate('cleaner', 'name email')
    .sort({ updatedAt: -1 });

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

    const request = await Request.findById(requestId).populate('client', 'id');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Not authorized to rate this request' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed requests can be rated' });
    }

    request.rating = rating;
    if (typeof review === 'string') {
      request.review = review;
    }
    await request.save();

    const populated = await Request.findById(requestId)
      .populate('client', 'name email phoneNumber address')
      .populate('cleaner', 'name email');

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
      requestType = 'specific', // 'specific' or 'general'
      budget,
      deadline
    } = req.body;

    const clientId = req.user.id; // From auth middleware

    // Validation
    if (!service || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
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