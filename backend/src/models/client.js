// models/Client.js
import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  age: {
  type: Number,
  required: true,
  min: [18, 'Minimum age is 18'],
  max: [80, 'Maximum age is 80']
  },
  address: { type: String, required: true },
  role: {type: String, default: "client"}
});

export default mongoose.model('Client', clientSchema);
