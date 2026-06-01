const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  internalOrderId: { type: String, required: true, unique: true }, // e.g., WZK-ORD-10234
  apiOrderId: { type: String }, // ID we will get from the external SMM panel later
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links order to a specific user
  serviceType: { type: String, enum: ['followers', 'likes', 'views'], required: true },
  instagramLink: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePaid: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'Pending' 
  },
  paymentId: { type: String }, // Razorpay Payment ID
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);   