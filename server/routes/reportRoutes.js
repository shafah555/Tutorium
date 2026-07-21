const router = require('express').Router();
const reports = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/monthly', reports.monthlyCollectionReport);
router.get('/due', reports.dueReport);
router.get('/students', reports.studentReport);
router.get('/model-tests', reports.modelTestReport);
router.get('/income', reports.incomeReport);

module.exports = router;
