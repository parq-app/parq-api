var express = require('express')
  , router = express.Router(), 
  Firebase = require('firebase'),
  GeoFire = require('geofire'),
  Spot = require('../models/spot');

var firebaseRef = new Firebase("https://parq.firebaseio.com");
var geoFire = new GeoFire(firebaseRef);

// Get a spot
router.get('/:id', function(req, res) {
  Spot.get(req.params.id).then(function(spot) {
    res.json({spot: spot});
  }).catch(error) {
    res.status(500).json({error: error});  
  }
});

// Create a new spot
router.post('/', function(req, res) {
  if (req.body.hasOwnProperty('userId') && req.body.hasOwnProperty('addr') && 
     req.body.hasOwnProperty('title')) {
     Spot.create(req.body.userId, req.body.addr, req.body.title).then(function(spot) {
      res.json({spot: spot}); 
     }).catch(function(error) {
      res.status(500).json({error: error}); 
     });
  } else {
    return false; /// Not the right way to handle this, need to return promise
  }
});

// Update a spot
router.put('/:id', function(req, res) {
  Spot.update(req.params.id, req.body).then(function() {
    res.status(204).send(); 
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
})

module.exports = router
