const amqp = require('amqplib');
const Delivery = require('../models/deliveryModel');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('channel created');
    console.log('Connected to RabbitMQ');
   
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
    process.exit(1);
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized');
  }
  return channel;
};

const sendMessage = async (queue, message) => {
  channel = getChannel();
  try {
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message sent to queue ${queue}:`, message);
  } catch (error) {
    console.error('Failed to send message', error);
  }
};

const consumeMessages = async (queue, callback) => {
  const channel = getChannel();  // Make sure you have a reference to the channel here
  
  await channel.consume(queue, async (msg) => {
    const { orderId, status, address, items } = JSON.parse(msg.content.toString());

    if (status !== 'cancelled') {
      const delivery = new Delivery({
        orderId,
        status,
        address,
        items
      });
      await delivery.save();
    }

    channel.ack(msg);
  });
};

// Example usage
const startConsumer = async () => {
  await connectRabbitMQ();  // Ensure RabbitMQ is connected before consuming messages
  const queue = 'order_created';  // Replace with your actual queue name
  await consumeMessages(queue);
};

// Start the consumer
startConsumer().catch(console.error);

module.exports = {
  connectRabbitMQ,
  getChannel,
  sendMessage,
  consumeMessages,
};
