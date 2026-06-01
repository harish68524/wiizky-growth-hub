const Order = require('../models/Order');
const Settings = require('../models/Settings');
const axios = require('axios');

// ==========================================
// 1. DYNAMIC CREATE ORDER FUNCTION
// ==========================================
exports.createOrder = async (req, res) => {
  try {
    const { userId, serviceType, instagramLink, quantity, pricePaid } = req.body;
    const internalOrderId = `WZK-ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    let settings = await Settings.findOne();
    if (!settings) {
        return res.status(500).json({ success: false, message: "System settings not configured. Contact Admin." });
    }

    // Safe God-Mode Dictionary
    const normalizedType = (serviceType || '').toLowerCase().trim();
    const dbKeyMap = {
        'followers': 'instagram', 'instagram followers': 'instagram',
        'likes': 'likes', 'instagram likes': 'likes',
        'views': 'views', 'instagram views': 'views',
        'youtube': 'youtube', 'facebook': 'facebook', 'tiktok': 'tiktok', 'telegram': 'telegram'
    };

    // If it's a legacy service, use the map. If it's a brand new custom service, just use its exact name!
    const dbKey = dbKeyMap[normalizedType] || serviceType;
    const mappedServiceId = dbKey ? settings.serviceMappings[dbKey] : null;

    if (!mappedServiceId) {
        console.log(`No service ID mapped for '${serviceType}'. Saving as Pending.`);
        const newOrder = new Order({ internalOrderId, user: userId, serviceType, instagramLink, quantity, pricePaid, status: 'Pending', apiOrderId: 'NEEDS-MANUAL-ID' });
        await newOrder.save();
        return res.status(200).json({ success: true, message: "Order placed. Pending manual processing.", order: newOrder });
    }

    let apiOrderId = 'API-FAILED-MANUAL'; 
    let initialStatus = 'Processing';

    if (process.env.TEST_MODE !== 'true' && settings.smmApiUrl && settings.smmApiKey) {
      try {
        const providerResponse = await axios.post(settings.smmApiUrl, null, {
          params: { key: settings.smmApiKey, action: 'add', service: mappedServiceId, link: instagramLink, quantity: quantity }
        });

        if (providerResponse.data && providerResponse.data.order) {
          apiOrderId = providerResponse.data.order.toString();
        } else {
          console.error("❌ Panel Error:", providerResponse.data);
          initialStatus = 'Pending Admin Review'; 
        }
      } catch (apiError) {
        console.error("❌ API Connection Failed:", apiError.message);
        initialStatus = 'Pending Admin Review'; 
      }
    } else {
       console.log(`🛠️ TEST MODE: Faked order for ${serviceType}`);
       apiOrderId = `FAKE-TEST-ID-${Math.floor(Math.random() * 99999)}`;
    }

    const newOrder = new Order({ internalOrderId, user: userId, serviceType, instagramLink, quantity, pricePaid, status: initialStatus, apiOrderId });
    await newOrder.save();
    res.status(200).json({ success: true, message: "Order placed successfully!", order: newOrder });

  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({ success: false, message: "Server error while creating order" });
  }
};

// ==========================================
// EXISTING ADMIN & USER FUNCTIONS
// ==========================================
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch orders" }); }
};

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch all orders" }); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status }, { new: true });
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to update order status" }); }
};

exports.fetchProviderServices = async (req, res) => {
  try {
    const response = await axios.post(req.body.apiUrl, null, { params: { key: req.body.apiKey, action: 'services' } });
    if (response.data.error) return res.status(400).json({ success: false, message: response.data.error });
    res.status(200).json({ success: true, services: response.data });
  } catch (error) { res.status(500).json({ success: false, message: "Could not connect to provider." }); }
};

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({}); 
        res.status(200).json({ success: true, settings });
    } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch settings" }); }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        
        if (req.body.smmApiUrl !== undefined) settings.smmApiUrl = req.body.smmApiUrl;
        if (req.body.smmApiKey !== undefined) settings.smmApiKey = req.body.smmApiKey;

        if (req.body.serviceMappings) {
            for (let key in req.body.serviceMappings) {
                settings.serviceMappings[key] = req.body.serviceMappings[key];
            }
        }

        if (req.body.prices) {
            if (!settings.prices) settings.prices = {};
            for (let key in req.body.prices) {
                settings.prices[key] = req.body.prices[key];
            }
        }
        
        await settings.save();
        res.status(200).json({ success: true, settings });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.syncOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const settings = await Settings.findOne();

    if (!order || !settings || !settings.smmApiUrl) return res.status(400).json({ success: false, message: "Missing order or settings." });
    if (!order.apiOrderId || order.apiOrderId.includes('FAILED') || order.apiOrderId.includes('MANUAL')) return res.status(400).json({ success: false, message: "Cannot sync a failed or manual order." });

    const response = await axios.post(settings.smmApiUrl, null, { params: { key: settings.smmApiKey, action: 'status', order: order.apiOrderId } });

    if (response.data && response.data.error) return res.status(400).json({ success: false, message: "SMM Panel Says: " + response.data.error });
    
    if (response.data && response.data.status) {
      let newStatus = String(response.data.status); 
      newStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      order.status = newStatus;
      await order.save();
      return res.status(200).json({ success: true, order });
    }
    res.status(400).json({ success: false, message: "Panel returned empty data." });
  } catch (error) { res.status(500).json({ success: false, message: "API Crash Details: " + error.message }); }
};

exports.resendOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const settings = await Settings.findOne();

    const normalizedType = order.serviceType.toLowerCase().trim();
    const dbKeyMap = {
        'followers': 'instagram', 'instagram followers': 'instagram',
        'likes': 'likes', 'instagram likes': 'likes',
        'views': 'views', 'instagram views': 'views',
        'youtube': 'youtube', 'facebook': 'facebook', 'tiktok': 'tiktok', 'telegram': 'telegram'
    };

    const mappedServiceId = settings.serviceMappings[dbKeyMap[normalizedType]];

    if (!mappedServiceId) return res.status(400).json({ success: false, message: "No service ID mapped for this category!" });

    const providerResponse = await axios.post(settings.smmApiUrl, null, {
      params: { key: settings.smmApiKey, action: 'add', service: mappedServiceId, link: order.instagramLink, quantity: order.quantity }
    });

    if (providerResponse.data && providerResponse.data.order) {
      order.apiOrderId = providerResponse.data.order.toString();
      order.status = 'Pending';
      await order.save();
      return res.status(200).json({ success: true, message: "Order Resent Successfully!", order });
    } else {
      return res.status(400).json({ success: false, message: "Panel rejected it again: " + (providerResponse.data.error || "Unknown error") });
    }
  } catch (error) { res.status(500).json({ success: false, message: "Network error trying to resend." }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.orderId);
    res.status(200).json({ success: true, message: "Order deleted." });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to delete order." }); }
};

exports.getProviderBalance = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.smmApiUrl || !settings.smmApiKey) return res.status(200).json({ success: true, balance: 0 });

    const response = await axios.post(settings.smmApiUrl, null, { params: { key: settings.smmApiKey, action: 'balance' } });

    if (response.data && response.data.balance !== undefined) {
      return res.status(200).json({ success: true, balance: response.data.balance, currency: response.data.currency || 'INR' });
    } else {
      return res.status(400).json({ success: false, message: "Provider didn't return balance." });
    }
  } catch (error) { res.status(500).json({ success: false, message: "Network error fetching balance." }); }
};

exports.autoSyncOrders = async () => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.smmApiUrl || !settings.smmApiKey) return;

    const activeOrders = await Order.find({
        status: { $nin: ['Completed', 'Canceled', 'Cancelled', 'Failed', 'Refunded', 'Partial'] },
        apiOrderId: { $regex: /^[0-9]+$/ } 
    });

    if (activeOrders.length === 0) return; 

    for (let order of activeOrders) {
        try {
            const response = await axios.post(settings.smmApiUrl, null, {
                params: { key: settings.smmApiKey, action: 'status', order: order.apiOrderId }
            });

            if (response.data && response.data.status) {
                let newStatus = String(response.data.status);
                newStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                
                if (order.status !== newStatus) {
                    order.status = newStatus;
                    await order.save();
                }
            }
        } catch (err) { /* silent fail for background worker */ }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) { console.error("[Auto-Sync Robot] Main Error:", error.message); }
};

// ==========================================
// 💳 RAZORPAY PAYMENT GENERATOR
// ==========================================
const Razorpay = require('razorpay');

exports.createPayment = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(req.body.amount * 100), // Razorpay needs Paise (multiply by 100)
      currency: "INR",
      receipt: `wzk_receipt_${Math.floor(Math.random() * 10000)}`
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ success: false, message: "Could not generate payment." });
  }
};