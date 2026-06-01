const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true }, // We will get this from Google Login later
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Lets you make yourself an admin
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

module.exports = mongoose.model('User', userSchema);