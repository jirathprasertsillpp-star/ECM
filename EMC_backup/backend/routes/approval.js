const router = require('express').Router();
const approvalController = require('../controllers/approvalController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/:id/submit', approvalController.submit);
router.post('/:id/approve', approvalController.approve);
router.post('/:id/reject', approvalController.reject);
router.get('/:id/logs', approvalController.getLogs);

module.exports = router;
