const router = require('express').Router();
const receiptsController = require('../controllers/receiptsController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/:itemId/receipts', receiptsController.getReceipts);
router.post('/:itemId/receipts', upload.single('receipt'), receiptsController.uploadReceipt);
router.delete('/receipts/:receiptId', receiptsController.deleteReceipt);
router.post('/receipts/:receiptId/ocr', receiptsController.ocrReceipt);

module.exports = router;
