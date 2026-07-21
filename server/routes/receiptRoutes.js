const router = require('express').Router();
const receipts = require('../controllers/receiptController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/pdf/:id', receipts.getReceiptPdf);
router.get('/:id', receipts.getReceipt);

module.exports = router;
