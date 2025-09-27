import mongoose from 'mongoose';
const { Schema } = mongoose;

const requestSchema = new Schema({
  client: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  cleaner: { 
    type: Schema.Types.ObjectId, 
    ref: 'Cleaner',
    required: function() {
      return this.requestType === 'specific';
    }
  },
  service: { 
    type: String, 
    required: true,
    enum: [
      'house cleaning',
      'deep cleaning', 
      'carpet cleaning',
      'window cleaning',
      'office cleaning',
      'move-in/move-out cleaning',
      'post-construction cleaning',
      'upholstery cleaning'
    ]
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'open'],
    default: 'pending'
  },
  requestType: {
    type: String,
    enum: ['specific', 'general'],
    default: 'specific'
  },
  note: { 
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative'],
    required: function() {
      return this.requestType === 'general';
    }
  },
  deadline: {
    type: Date,
    required: function() {
      return this.requestType === 'general';
    }
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // Client rating of the cleaner (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Client review/comment about the cleaner
  review: {
    type: String,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  // Cleaner rating of the client (1-5 stars) - for future feature
  cleanerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Cleaner review/comment about the client - for future feature
  cleanerReview: {
    type: String,
    maxlength: [500, 'Cleaner review cannot exceed 500 characters']
  },
  totalCost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  },
  // Flag to track if client has rated this job
  clientRated: {
    type: Boolean,
    default: false
  },
  // Flag to track if cleaner has rated this job - for future feature
  cleanerRated: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for better query performance
requestSchema.index({ client: 1, status: 1 });
requestSchema.index({ cleaner: 1, status: 1 });
requestSchema.index({ requestType: 1, status: 1 });
requestSchema.index({ date: 1 });
requestSchema.index({ status: 1, date: 1 }); // For auto-completion queries

// Pre-save middleware to validate end time is after start time
requestSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    const error = new Error('End time must be after start time');
    return next(error);
  }
  
  // Auto-set completedAt if status is being set to completed and completedAt is not set
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set clientRated flag when rating is provided
  if (this.rating && !this.clientRated) {
    this.clientRated = true;
  }
  
  // Set cleanerRated flag when cleaner rating is provided - for future feature
  if (this.cleanerRating && !this.cleanerRated) {
    this.cleanerRated = true;
  }
  
  next();
});

  /**
   * Calculates the duration of a cleaning request in hours
   * @method getDuration
   * @returns {number} Duration in hours (decimal format)
   */
  requestSchema.methods.getDuration = function() {
    // Parse hours and minutes from HH:MM format strings into numbers
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    
    // Convert hours and minutes to total minutes since midnight
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Convert difference from minutes to hours (returns decimal hours)
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  /**
   * Validates if the request's datetime has already passed
   * @method isPast
   * @returns {boolean} true if request time is in the past, false otherwise
   */
  requestSchema.methods.isPast = function() {
    // Create Date object from request's date field
    const requestDateTime = new Date(this.date);
    // Extract hour and minute from endTime string
    const [hour, minute] = this.endTime.split(':').map(Number);
    // Set the exact time of the request's completion
    requestDateTime.setHours(hour, minute, 0, 0);
    
    // Compare with current time to determine if it's in the past
    return requestDateTime < new Date();
  };// Instance method to check if request should be auto-completed
requestSchema.methods.shouldAutoComplete = function() {
  if (this.status !== 'accepted') return false;
  
  const now = new Date();
  const jobDate = new Date(this.date);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  jobDate.setHours(endHour, endMinute, 0, 0);
  
  return now > jobDate;
};

// Instance method to calculate total cost based on cleaner's hourly rate
requestSchema.methods.calculateTotalCost = async function() {
  if (!this.cleaner) return 0;
  
  // Populate cleaner if not already populated
  if (!this.cleaner.hourlyPrice) {
    await this.populate('cleaner', 'hourlyPrice');
  }
  
  const duration = this.getDuration();
  return duration * this.cleaner.hourlyPrice;
};

// Static method to find requests for a specific date
requestSchema.statics.findByDate = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
};

// Static method to find past due jobs that should be completed
requestSchema.statics.findPastDueJobs = function() {
  const now = new Date();
  
  return this.aggregate([
    {
      $match: {
        status: 'accepted'
      }
    },
    {
      $addFields: {
        endDateTime: {
          $dateFromParts: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: { $toInt: { $substr: ['$endTime', 0, 2] } },
            minute: { $toInt: { $substr: ['$endTime', 3, 2] } }
          }
        }
      }
    },
    {
      $match: {
        endDateTime: { $lt: now }
      }
    }
  ]);
};

export default mongoose.model('Request', requestSchema);