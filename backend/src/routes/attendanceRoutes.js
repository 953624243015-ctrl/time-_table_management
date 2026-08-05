const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/',         authenticate, ctrl.getAttendance);
router.get('/today',    authenticate, ctrl.getTodaySummary);
router.post('/',        authenticate, ctrl.markAttendance);
router.post('/bulk',    authenticate, ctrl.bulkMarkAttendance);

module.exports = router;
