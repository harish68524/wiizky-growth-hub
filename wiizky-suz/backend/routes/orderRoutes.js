const express = require('express');
const router = express.Router();

const { 
  createOrder, 
  getUserOrders, 
  getAllOrdersAdmin, 
  updateOrderStatus, 
  fetchProviderServices, 
  getSettings, 
  updateSettings,
  syncOrderStatus, 
  resendOrder, 
  deleteOrder,
  getProviderBalance,
  createPayment
} = require('../controllers/orderController');

// User Routes
router.post('/new', createOrder);
router.post('/create-payment', createPayment);
router.get('/:userId', getUserOrders); 

// Admin Specific Routes
router.get('/admin/all', getAllOrdersAdmin); 
router.post('/admin/fetch-services', fetchProviderServices);
router.get('/admin/settings', getSettings);
router.put('/admin/settings', updateSettings);
router.get('/admin/balance', getProviderBalance); 

// Admin Action Routes for Specific Orders
router.put('/admin/:orderId', updateOrderStatus);
router.post('/admin/:orderId/sync', syncOrderStatus); 
router.post('/admin/:orderId/resend', resendOrder);   
router.delete('/admin/:orderId', deleteOrder);

module.exports = router;