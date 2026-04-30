const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session.adminUser) return next();
  return res.redirect('/admin/login');
}

router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

router.get('/', requireAdmin, adminController.dashboard);
router.get('/players', requireAdmin, adminController.players);
router.get('/logs', requireAdmin, adminController.logs);
router.get('/kills', requireAdmin, adminController.kills);
router.get('/pedidos', requireAdmin, adminController.orders);
router.post('/pedidos/:id/status', requireAdmin, adminController.updateOrderStatus);
router.get('/allowlist', requireAdmin, adminController.allowlist);
router.post('/allowlist/:id/review', requireAdmin, adminController.reviewAllowlist);

module.exports = router;
