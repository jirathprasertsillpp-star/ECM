const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', dashboardController.getStats);
router.get('/chart', dashboardController.getChart);
router.get('/recent', dashboardController.getRecent);

module.exports = router;
