var express = require('express')
  , router = express.Router()

router.use('/spots', require('./spots'));

module.exports = router;
