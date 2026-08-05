const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/departmentController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('name').notEmpty().withMessage('Department name is required').trim(),
  body('code').notEmpty().withMessage('Department code is required').trim(),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/:id', authenticate, authorizeAdmin, validate, ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
