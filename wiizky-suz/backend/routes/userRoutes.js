const express = require('express');
const router = express.Router();
const { syncUser } = require('../controllers/userController');

// Route: POST /api/users/sync
router.post('/sync', syncUser);

module.exports = router;