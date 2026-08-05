const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/timeslotController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('slot_name').notEmpty().withMessage('Slot name is required'),
  body('start_time').notEmpty().withMessage('Start time is required'),
  body('end_time').notEmpty().withMessage('End time is required'),
  body('period_number').isInt({ min: 1 }).withMessage('Period number must be a positive integer'),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/academic-settings', authenticate, ctrl.getAcademicSettings);
router.get('/academic-years', authenticate, ctrl.getAcademicYears);
router.get('/semesters', authenticate, ctrl.getSemesters);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/academic-settings', authenticate, authorizeAdmin, ctrl.updateAcademicSettings);
router.put('/:id', authenticate, authorizeAdmin, validate, ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
