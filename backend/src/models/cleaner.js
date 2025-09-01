// models/Cleaner.js
import mongoose from 'mongoose';

// Define the schedule schema for each day
const dayScheduleSchema = new mongoose.Schema({
  available: { 
    type: Boolean, 
    default: false 
  },
  startTime: { 
    type: String, 
    default: '09:00',
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: { 
    type: String, 
    default: '17:00',
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  }
}, { _id: false });

// Main schedule schema containing all days
const scheduleSchema = new mongoose.Schema({
  monday: { type: dayScheduleSchema, default: () => ({}) },
  tuesday: { type: dayScheduleSchema, default: () => ({}) },
  wednesday: { type: dayScheduleSchema, default: () => ({}) },
  thursday: { type: dayScheduleSchema, default: () => ({}) },
  friday: { type: dayScheduleSchema, default: () => ({}) },
  saturday: { type: dayScheduleSchema, default: () => ({}) },
  sunday: { type: dayScheduleSchema, default: () => ({}) }
}, { _id: false });

const cleanerSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phoneNumber: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  gender: { 
    type: String, 
    required: true,
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number,
    required: true,
    min: [18, 'Minimum age is 18'],
    max: [80, 'Maximum age is 80']
  },
  hourlyPrice: { 
    type: Number, 
    required: true,
    min: [5, 'Minimum hourly price is $5'],
    max: [200, 'Maximum hourly price is $200']
  },
  stars: { 
    type: Number, 
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  comments: [{ 
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }],
  service: [{
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
  }],
  schedule: {
    type: scheduleSchema,
    required: true,
    validate: {
      validator: function(schedule) {
        // At least one day must be available
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.some(day => schedule[day] && schedule[day].available);
      },
      message: 'At least one day must be available in the schedule'
    }
  },
  scheduleType: {
    type: String,
    enum: ['STRICT', 'NORMAL'],
    default: 'NORMAL',
    required: true
  },
  role: {
    type: String, 
    default: "cleaner"
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Index for better query performance
cleanerSchema.index({ stars: -1 });
cleanerSchema.index({ hourlyPrice: 1 });
cleanerSchema.index({ service: 1 });
cleanerSchema.index({ isActive: 1 });

// Pre-save middleware to ensure schedule validation
cleanerSchema.pre('save', function(next) {
  // Validate that end time is after start time for each available day
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    if (this.schedule[day] && this.schedule[day].available) {
      const startTime = this.schedule[day].startTime;
      const endTime = this.schedule[day].endTime;
      
      if (startTime >= endTime) {
        const error = new Error(`End time must be after start time for ${day}`);
        return next(error);
      }
    }
  }
  
  next();
});

// Instance method to check if cleaner is available on a specific day and time
cleanerSchema.methods.isAvailableAt = function(day, time) {
  const daySchedule = this.schedule[day.toLowerCase()];
  if (!daySchedule || !daySchedule.available) {
    return false;
  }
  
  return time >= daySchedule.startTime && time <= daySchedule.endTime;
};

// Instance method to get available time slots for a specific day
cleanerSchema.methods.getAvailableSlots = function(day) {
  const daySchedule = this.schedule[day.toLowerCase()];
  if (!daySchedule || !daySchedule.available) {
    return null;
  }
  
  return {
    startTime: daySchedule.startTime,
    endTime: daySchedule.endTime,
    available: true
  };
};

// Static method to find cleaners available at specific time
cleanerSchema.statics.findAvailableAt = function(day, time) {
  const dayField = `schedule.${day.toLowerCase()}`;
  return this.find({
    [`${dayField}.available`]: true,
    [`${dayField}.startTime`]: { $lte: time },
    [`${dayField}.endTime`]: { $gte: time },
    isActive: true
  });
};

export default mongoose.model('Cleaner', cleanerSchema);