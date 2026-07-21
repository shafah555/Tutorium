const router = require('express').Router();
const students = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.get('/', students.getStudents);
router.get('/:id', students.getStudent);
router.post('/', upload.single('photo'), students.createStudent);
router.put('/:id', upload.single('photo'), students.updateStudent);
router.delete('/:id', students.deleteStudent);
router.post('/:id/complete', students.completeStudent);

module.exports = router;
