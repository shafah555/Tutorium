const router = require('express').Router();
const auth = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPassword);
router.get('/me', authMiddleware, auth.me);

module.exports = router;
