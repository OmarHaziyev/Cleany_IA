import { Schema } from 'mongoose';

const scheduleSchema = new Schema({
  day: { type: String, required: true },          // e.g. 'Monday'
  start: { type: String, required: true },        // e.g. '09:00'
  end: { type: String, required: true },          // e.g. '17:00'
  isReserved: { type: Boolean, default: false }   // reserved or not
});

export default scheduleSchema;
