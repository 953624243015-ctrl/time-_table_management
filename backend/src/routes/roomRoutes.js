const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/roomController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const validate = [
  body('room_number').notEmpty().withMessage('Room number is required'),
  body('room_type').isIn(['classroom','computer_lab','electronics_lab','seminar_hall']).withMessage('Invalid room type'),
];

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorizeAdmin, validate, ctrl.create);
router.put('/:id', authenticate, authorizeAdmin, validate, ctrl.update);
router.delete('/:id', authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
