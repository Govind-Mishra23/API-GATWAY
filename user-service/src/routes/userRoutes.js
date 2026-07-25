const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Internal / profile routes
router.post('/', userController.createProfile);
router.get('/me', userController.getMe);
router.get('/:id', userController.getProfileById);
router.put('/:id', userController.updateProfile);

module.exports = router;
