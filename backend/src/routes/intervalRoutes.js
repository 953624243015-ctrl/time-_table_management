const router = require('express').Router();
const ctrl = require('../controllers/intervalController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/settings',          authenticate, ctrl.getSettings);
router.post('/settings',         authenticate, authorizeAdmin, ctrl.saveSettings);
router.post('/calculate',        authenticate, ctrl.calculateTimings);
router.post('/apply',            authenticate, authorizeAdmin, ctrl.applyTimings);

module.exports = router;
