const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], default: 'Pending' }, // Ensure 'status' is correctly defined,
  deliveryDate: { type: Date },
  address: { type: String},
  items: [
    {
      id: { type: String, required: true },
      quantity: { type: Number, required: true }
    }
  ]
});

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
