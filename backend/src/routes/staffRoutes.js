const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/staffController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('staff_id').notEmpty().withMessage('Staff ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('department_id').isInt({ min: 1 }).withMessage('Valid department is required'),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/:id', authenticate, authorizeAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('department_id').isInt({ min: 1 }).withMessage('Valid department is required'),
], ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
