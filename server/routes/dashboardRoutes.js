const router = require('express').Router();
const dashboard = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', dashboard.getDashboard);

module.exports = router;
