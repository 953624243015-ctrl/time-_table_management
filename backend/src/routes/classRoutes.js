const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/classController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('department_id').isInt({ min: 1 }).withMessage('Valid department is required'),
  body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be 1-4'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
  body('section').notEmpty().withMessage('Section is required'),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/:id', authenticate, authorizeAdmin, validate, ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
