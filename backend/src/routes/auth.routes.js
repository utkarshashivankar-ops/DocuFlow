const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../utils/validators');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/register', authLimiter, validate(v.registerSchema), c.register);
router.post('/login', authLimiter, validate(v.loginSchema), c.login);
router.post('/forgot-password', authLimiter, validate(v.forgotSchema), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetSchema), c.resetPassword);
router.get('/me', protect, c.me);

module.exports = router;
