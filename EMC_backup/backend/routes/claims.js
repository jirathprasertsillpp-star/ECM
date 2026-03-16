const router = require('express').Router();
const claimsController = require('../controllers/claimsController');
const itemsController = require('../controllers/itemsController');
const auth = require('../middleware/auth');
const log = require('../middleware/activityLogger');

router.use(auth);

router.get('/', claimsController.list);
router.post('/', log('CREATE_CLAIM', 'claim'), claimsController.create);
router.post('/ocr', log('OCR_SCAN', 'receipt'), claimsController.ocrReceipt);
router.get('/:id', claimsController.getById);
router.put('/:id', log('UPDATE_CLAIM', 'claim', req => req.params.id), claimsController.update);
router.delete('/:id', log('DELETE_CLAIM', 'claim', req => req.params.id), claimsController.delete);
router.post('/:id/submit', log('SUBMIT_CLAIM', 'claim', req => req.params.id), claimsController.submitClaim);

// Items sub-routes
router.post('/:id/items', itemsController.addItem);
router.put('/:id/items/:itemId', itemsController.updateItem);
router.delete('/:id/items/:itemId', itemsController.deleteItem);

module.exports = router;
