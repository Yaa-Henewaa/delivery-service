const Delivery = require('../models/deliveryModel');
const { consumeMessages, sendMessage } = require('../utils/rabbitmq');

const orders = new Map(); // In-memory store for orders and timers



// Function to start the timer for an order
const startOrderTimer = (orderId) => {
  console.log(`Starting timer for order ${orderId}`);
  return setTimeout(() => {
    markOrderAsCompleted(orderId);
  }, 10000); // 60,000 ms = 1 minute
};


const markOrderAsCompleted = async (orderId) => {
  try {
    const delivery = await Delivery.findOne({ orderId });
    if (delivery) {
      delivery.status = 'Completed';
      await delivery.save();
      sendMessage('order_completed', { orderId: delivery._id, address: delivery.address, items: delivery.items });
      return { success: true };
    } else {
      return { success: false, message: `Delivery with orderId ${orderId} not found` };
    }
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return { success: false, message: 'Internal Server Error' };
  }
};

const completeDelivery = async (req, res) => {
  const { orderId } = req.params;

  const result = await markOrderAsCompleted(orderId);

  if (result.success) {
    res.status(200).json({ message: 'Delivery marked as completed' });
  } else {
    res.status(404).json({ message: result.message });
  }
};

// Process Order from RabbitMQ
const processOrder = async (message) => {
  const { orderId, status, address, items } = message;

  if (status === 'Cancelled') {
    console.log('Order is cancelled, delivery cannot be processed');
    return;
  }

  try {
    const delivery = new Delivery({ orderId, address, items });
    await delivery.save();
    console.log('Delivery created for order:', orderId);

    // Start timer when delivery is created
    const timer = startOrderTimer(orderId);
    orders.set(orderId, { status: 'Pending', timer });
  } catch (error) {
    console.error('Failed to create delivery:', error);
  }
};

// Create Delivery
const createDelivery = async (req, res) => {
  const { orderId, address, items } = req.body; // Expecting id and details in the request body
  console.log('Request body:', req.body);

  if (!address) {
    return res.status(400).json({ message: 'Address is required' });
  }

  try {
    const newDelivery = new Delivery({ orderId, address, items });
    await newDelivery.save(); // Save to the database



    // Start timer when delivery is created
    const timer = startOrderTimer(orderId);
    orders.set(orderId, { status: 'Processing', timer });

    sendMessage('order_created', { orderId: newDelivery._id, address: newDelivery.address, items: newDelivery.items });
    res.status(201).json(newDelivery);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create delivery', error });
  }
};

// Get Delivery By ID
const getDeliveryById = async (req, res) => {
  const { id } = req.params;

  try {
    const delivery = await Delivery.findById(id); // Use DB query to find delivery

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery', error });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!orders.has(orderId)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders.get(orderId);
  clearTimeout(order.timer); // Clear the timer if it exists
  order.status = 'Cancelled';
  orders.set(orderId, order);

  console.log(`Order ${orderId} cancelled.`);

  res.status(200).json({ message: `Order ${orderId} has been cancelled.` });
};

// Initialize Message Consumers
const initializeMessageConsumers = () => {
  consumeMessages('order_created', processOrder);
};

module.exports = {
  createDelivery,
  getDeliveryById,
  cancelOrder,
  completeDelivery, 
  initializeMessageConsumers,
};
