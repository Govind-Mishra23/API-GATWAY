const UserProfile = require('../models/userProfileModel');

// Helper to check authorization (user is updating/viewing their own data OR is an admin)
const isAuthorized = (req, targetUserId) => {
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];
  return requestUserId === targetUserId || requestUserRole === 'admin';
};

// Create a profile (called internally by auth-service or gateway)
exports.createProfile = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ message: 'userId and email are required' });
    }

    let profile = await UserProfile.findOne({ userId });
    if (profile) {
      return res.status(200).json({ message: 'Profile already exists', profile });
    }

    profile = new UserProfile({ userId, email });
    await profile.save();

    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create profile', error: error.message });
  }
};

// Get current user's profile
exports.getMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const email = req.headers['x-user-email'] || '';

    if (!userId) {
      return res.status(400).json({ message: 'Missing user identification header' });
    }

    let profile = await UserProfile.findOne({ userId });
    
    // Lazy profile creation fallback
    if (!profile) {
      profile = new UserProfile({ userId, email: email || `${userId}@example.com` });
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Get profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAuthorized(req, id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const profile = await UserProfile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

// Update profile by ID
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, orders } = req.body;

    if (!isAuthorized(req, id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let profile = await UserProfile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (name !== undefined) profile.name = name;
    if (address !== undefined) profile.address = address;
    if (orders !== undefined) profile.orders = orders;

    await profile.save();
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
