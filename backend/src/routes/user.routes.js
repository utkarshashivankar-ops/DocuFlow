const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { profileSchema } = require('../utils/validators');

router.use(protect);
router.get('/profile', c.getProfile);
router.put('/profile', validate(profileSchema), c.updateProfile);

module.exports = router;
