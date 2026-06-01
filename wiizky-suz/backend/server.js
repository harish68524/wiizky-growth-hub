const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8','1.1.1.1']);

const app = express();
const { autoSyncOrders } = require('./controllers/orderController');

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

// --- NEW ROUTES SETUP ---
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
// ------------------------

//orders
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);
//-------------------------

// A simple test route
app.get('/', (req, res) => {
  res.send('Wiizky SMM Backend is ALIVE! 🚀');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server is running on http://localhost:${PORT}`);
});

// ==========================================
// 🤖 START THE AUTO-SYNC BACKGROUND ROBOT
// ==========================================
// This makes the robot run every 5 minutes (300,000 milliseconds)
setInterval(() => {
    autoSyncOrders();
}, 5 * 60 * 1000); 

// Run it once immediately when the server boots up just to catch up!
setTimeout(() => {
    autoSyncOrders();
}, 5000);