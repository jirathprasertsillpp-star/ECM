const router = require('express').Router();
const fuelController = require('../controllers/fuelController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/:itemId/fuel', fuelController.saveFuel);
router.get('/:itemId/fuel', fuelController.getFuel);

module.exports = router;
