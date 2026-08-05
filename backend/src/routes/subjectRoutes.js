const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/subjectController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('subject_code').notEmpty().withMessage('Subject code is required'),
  body('subject_name').notEmpty().withMessage('Subject name is required'),
  body('department_id').isInt({ min: 1 }).withMessage('Valid department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Valid semester is required'),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/:id', authenticate, authorizeAdmin, validate, ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);
router.post('/:id/assign-faculty', authenticate, authorizeAdmin, ctrl.assignFaculty);

module.exports = router;
