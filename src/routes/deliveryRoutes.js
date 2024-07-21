const express = require('express');
const deliveryController = require('../controllers/deliveryController');



const router = express.Router();

router.post('/delivery', deliveryController.createDelivery);
router.get('/delivery/:id', deliveryController.getDeliveryById);
router.get('/', deliveryController.initializeMessageConsumers);
router.post('/:orderId/complete', deliveryController.completeDelivery);
// router.post('/orders/:orderId/cancel', deliveryController.cancelOrder);

module.exports = router;
