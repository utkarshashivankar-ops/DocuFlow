const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));
router.get('/overview', c.overview);
router.post('/notifications/scan', c.runScan);

module.exports = router;
