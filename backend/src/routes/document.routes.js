const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload, requireValidFile } = require('../middleware/upload');
const versions = require('../controllers/versionController');
const shares = require('../controllers/shareController');
const v = require('../utils/validators');

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please try again later.' },
});

router.use(protect);

// fixed paths MUST come before "/:id"
router.post('/upload', uploadLimiter, upload, requireValidFile, validate(v.uploadBodySchema), c.uploadDocument);
router.get('/search', validate(v.searchQuerySchema, 'query'), c.searchDocuments);
router.get('/stats', c.stats);
router.get('/expiring', c.expiringDocuments);
router.get('/expired', c.expiredDocuments);

router.post('/', validate(v.createDocumentSchema), c.createDocument);
router.get('/', validate(v.listQuerySchema, 'query'), c.listDocuments);
router.get('/:id', c.getDocument);
router.put('/:id', validate(v.updateDocumentSchema), c.updateDocument);
router.delete('/:id', c.deleteDocument);


// version history
router.get('/:id/versions', versions.list);
router.post('/:id/versions', uploadLimiter, upload, requireValidFile, versions.add);
router.post('/:id/versions/:version/restore', versions.restore);

// secure sharing (owner side; the public side lives in share.routes.js)
router.post('/:id/share', validate(v.shareCreateSchema), shares.create);
router.get('/:id/shares', shares.list);
router.delete('/:id/shares/:linkId', shares.revoke);

module.exports = router;
