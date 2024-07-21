require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const deliveryRouter = require('./routes/deliveryRoutes');
const { connectRabbitMQ } = require('./utils/rabbitmq');

const app = express();

const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware
app.use(express.json());


// Routes
app.use('/api/deliveries', deliveryRouter);

// Database connection
mongoose.connect(process.env.MONGO_URI, ).then(() => {
  console.log('Connected to MongoDB');
  
}).catch((error) => {
  console.error('Failed to connect to MongoDB', error);
});

connectRabbitMQ();

module.exports = app;
