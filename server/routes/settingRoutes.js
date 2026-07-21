const router = require('express').Router();
const settings = require('../controllers/settingController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.get('/', settings.getSettings);
router.put('/', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'signature', maxCount: 1 }]), settings.updateSettings);

module.exports = router;
