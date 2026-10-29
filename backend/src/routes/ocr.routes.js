const router = require('express').Router();
const c = require('../controllers/ocrController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ocrProcessSchema } = require('../utils/validators');

router.post('/process', protect, validate(ocrProcessSchema), c.processDocument);

module.exports = router;
