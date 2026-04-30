const express = require('express');
const publicController = require('../controllers/publicController');
const allowlistController = require('../controllers/allowlistController');
const storeController = require('../controllers/storeController');

const router = express.Router();

router.get('/', publicController.home);
router.get('/regras', publicController.rules);
router.get('/conectar', publicController.connect);
router.get('/status', publicController.status);

router.get('/allowlist', allowlistController.show);
router.post('/allowlist/check', allowlistController.check);
router.post('/allowlist/release', allowlistController.release);

router.get('/loja', storeController.home);
router.get('/loja/vips', storeController.vips);
router.get('/loja/veiculos', storeController.vehicles);
router.get('/loja/outros', storeController.others);
router.post('/loja/pedido', storeController.createOrder);

module.exports = router;
