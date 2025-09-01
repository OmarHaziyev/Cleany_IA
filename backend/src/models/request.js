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
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  totalCost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  }
}, { 
  timestamps: true 
});

// Index for better query performance
requestSchema.index({ client: 1, status: 1 });
requestSchema.index({ cleaner: 1, status: 1 });
requestSchema.index({ requestType: 1, status: 1 });
requestSchema.index({ date: 1 });

// Pre-save middleware to validate end time is after start time
requestSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    const error = new Error('End time must be after start time');
    return next(error);
  }
  next();
});

// Instance method to calculate duration in hours
requestSchema.methods.getDuration = function() {
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return (endTotalMinutes - startTotalMinutes) / 60;
};

// Instance method to check if request is in the past
requestSchema.methods.isPast = function() {
  const requestDateTime = new Date(this.date);
  const [hour, minute] = this.endTime.split(':').map(Number);
  requestDateTime.setHours(hour, minute, 0, 0);
  
  return requestDateTime < new Date();
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

export default mongoose.model('Request', requestSchema);