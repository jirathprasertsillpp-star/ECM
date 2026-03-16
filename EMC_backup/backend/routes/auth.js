const router = require('express').Router();
const authController = require('../controllers/authController');
const authLineController = require('../controllers/authLineController');
const auth = require('../middleware/auth');
const log = require('../middleware/activityLogger');

router.post('/login', authController.login);
router.post('/line-login', authLineController.lineLogin);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, log('UPDATE_PROFILE', 'user', r => r.user.id), authController.updateProfile);

module.exports = router;
