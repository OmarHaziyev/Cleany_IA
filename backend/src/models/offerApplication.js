import mongoose from 'mongoose';
const { Schema } = mongoose;

const offerApplicationSchema = new Schema({
  offer: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  cleaner: {
    type: Schema.Types.ObjectId,
    ref: 'Cleaner',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'selected', 'rejected'],
    default: 'pending'
  },
  selectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure a cleaner can only apply once to an offer
offerApplicationSchema.index({ offer: 1, cleaner: 1 }, { unique: true });

const OfferApplication = mongoose.model('OfferApplication', offerApplicationSchema);

export default OfferApplication;
