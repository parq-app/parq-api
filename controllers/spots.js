var express = require('express'),
  router = express.Router(),
  Firebase = require('firebase'),
  GeoFire = require('geofire'),
  Spot = require('../models/spot');

var firebaseRef = new Firebase("https://parq.firebaseio.com");
var geoFire = new GeoFire(firebaseRef);

// Get a spot
router.get('/:id', function(req, res) {
  Spot.get(req.params.id).then(function(spot) {
    res.json({spot: spot});
  })
});

module.exports = router
