const router = require('express').Router();
const c = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { notificationListSchema } = require('../utils/validators');

router.use(protect);
router.get('/', validate(notificationListSchema, 'query'), c.list);
router.get('/unread-count', c.unreadCount);
router.post('/scan', c.scanMine);
router.post('/read-all', c.markAllRead);
router.patch('/:id/read', c.markRead);
router.delete('/:id', c.remove);

module.exports = router;
