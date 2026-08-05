const router = require('express').Router();
const ctrl = require('../controllers/statisticsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/workload',      authenticate, ctrl.getTeacherWorkload);
router.get('/subjects',      authenticate, ctrl.getSubjectDistribution);
router.get('/departments',   authenticate, ctrl.getDepartmentStats);
router.get('/audit',         authenticate, ctrl.getAuditLogs);
router.get('/weekly',        authenticate, ctrl.getWeeklySchedule);
router.get('/colors',        authenticate, ctrl.getSubjectColors);
router.post('/colors',       authenticate, authorizeAdmin, ctrl.updateSubjectColor);

module.exports = router;
