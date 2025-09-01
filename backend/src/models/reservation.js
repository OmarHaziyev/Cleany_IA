import mongoose from 'mongoose';
const { Schema } = mongoose;

const reservationSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cleaner: { type: Schema.Types.ObjectId, ref: 'Cleaner', required: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g. "14:00"
  endTime: { type: String, required: true },   // e.g. "16:00"
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
    default: 'pending'
  },
  note: { type: String },
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
