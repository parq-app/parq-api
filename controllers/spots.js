var express = require('express');
var Spot = require('../models/spot');

var router = express.Router();

// Get a spot
router.get('/:id', function(req, res) {
  Spot.get(req.params.id).then(function(spot) {
    res.status(200).json({spot: spot});
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Create a new spot
router.post('/', function(req, res) {
  if (req.body.hasOwnProperty('userId') && req.body.hasOwnProperty('addr') &&
     req.body.hasOwnProperty('title') && req.body.hasOwnProperty('lat') &&
     req.body.hasOwnProperty('long')) {
    Spot.create(req.body.userId, req.body.addr, req.body.lat, req.body.long, req.body.title)
     .then(function(spot) {
       res.json({spot: spot});
     }).catch(function(error) {
       res.status(500).json({error: error});
     });
  } else {
    res.status(400).json({error: "Missing expected body parameter."});
  }
});

// Update a spot
router.put('/:id', function(req, res) {
  Spot.update(req.params.id, req.body).then(function() {
    res.status(204).send();
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

module.exports = router;
