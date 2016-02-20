var express = require('express'),
  router = express.Router();

router.use('/spots', require('./spots'));
router.use('/users', require('./users'));

module.exports = router;
