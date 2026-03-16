const router = require('express').Router();
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/claims/:id/pdf', exportController.exportPDF);
router.get('/excel', exportController.exportExcel);

module.exports = router;
