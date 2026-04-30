const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

router.use(apiController.applyCors);
router.get('/health', apiController.health);
router.get('/site/bootstrap', apiController.siteBootstrap);
router.get('/site/products', apiController.siteStoreProducts);
router.post('/site/orders', apiController.siteCreateOrder);
router.post('/site/citizen/check', apiController.siteCitizenCheck);
router.post('/site/whitelist/submit', apiController.siteWhitelistSubmit);
router.get('/panel/options', apiController.panelOptions);
router.post('/panel/send-message', apiController.sendPanelMessage);
router.post('/fivem/logs', apiController.receiveFiveMLog);

module.exports = router;
