const router = require('express').Router();
const payments = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', payments.getPayments);
router.get('/pending/:studentId', payments.getPendingMonths);
router.post('/', payments.receivePayment);
router.put('/:id', payments.updatePayment);

module.exports = router;
