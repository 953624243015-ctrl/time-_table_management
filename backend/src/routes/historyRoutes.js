const router = require('express').Router();
const ctrl = require('../controllers/historyController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/',                authenticate, ctrl.listVersions);
router.get('/:id',             authenticate, ctrl.getVersion);
router.post('/save',           authenticate, authorizeAdmin, ctrl.saveVersion);
router.post('/:id/restore',    authenticate, authorizeAdmin, ctrl.restoreVersion);

module.exports = router;
