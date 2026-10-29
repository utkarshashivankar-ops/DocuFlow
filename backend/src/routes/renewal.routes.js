const router = require('express').Router();
const c = require('../controllers/renewalController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { renewalUpdateSchema } = require('../utils/validators');

router.use(protect);
router.get('/', c.overview);
router.get('/document/:documentId', c.forDocument);
router.put('/:id', validate(renewalUpdateSchema), c.update);

module.exports = router;
