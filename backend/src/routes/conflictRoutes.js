const router = require('express').Router();
const ctrl = require('../controllers/conflictController');
const { authenticate } = require('../middleware/auth');

router.post('/check',  authenticate, ctrl.checkConflicts);
router.get('/report',  authenticate, ctrl.getFullConflictReport);

module.exports = router;
