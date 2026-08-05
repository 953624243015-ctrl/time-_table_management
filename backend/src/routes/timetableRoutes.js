const router = require('express').Router();
const ctrl = require('../controllers/timetableController');
const { exportPDF, exportExcel } = require('../controllers/exportController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/generate', authenticate, authorizeAdmin, ctrl.generateTimetable);
router.get('/list', authenticate, ctrl.listTimetables);
router.get('/class/:id', authenticate, ctrl.getClassTimetable);
router.get('/staff/:id', authenticate, ctrl.getStaffTimetable);
router.get('/room/:id', authenticate, ctrl.getRoomTimetable);
router.get('/department/:id', authenticate, ctrl.getDepartmentTimetable);

// Export routes
router.get('/export/pdf', authenticate, exportPDF);
router.get('/export/excel', authenticate, exportExcel);

module.exports = router;
