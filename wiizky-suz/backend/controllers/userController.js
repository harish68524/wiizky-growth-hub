const User = require('../models/User');

// When a user logs in with Google, we save them or find their existing profile
exports.syncUser = async (req, res) => {
  try {
    const { firebaseUid, name, email, profilePicture } = req.body;

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // If not, create a new user in our database
      user = new User({
        firebaseUid,
        name,
        email,
        profilePicture
      });
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};