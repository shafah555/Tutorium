const router = require('express').Router();
const modelTests = require('../controllers/modelTestController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', modelTests.getModelTests);
router.post('/', modelTests.createModelTest);
router.put('/:id', modelTests.updateModelTest);
router.delete('/:id', modelTests.deleteModelTest);
router.post('/:id/pay', modelTests.payModelTest);

module.exports = router;
