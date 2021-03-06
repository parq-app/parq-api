var express = require('express');
var router = express.Router();
var Spot = require('../models/spot');

// Get a spot by id
router.get('/:id', function(req, res) {
  Spot.get(req.params.id).then(function(spot) {
    res.status(200).json(spot);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Create a new spot
router.post('/', function(req, res) {
  if (!req.body.hasOwnProperty('userId') || !req.body.hasOwnProperty('addr') ||
     !req.body.hasOwnProperty('title') || !req.body.hasOwnProperty('lat') ||
     !req.body.hasOwnProperty('long')) {
    res.status(400).json({error: "Missing expected body parameter."});
    return;
  }

  Spot.create(req.body.userId, req.body.addr, req.body.lat,
              req.body.long, req.body.title)
    .then(function(spot) {
      res.status(201).json(spot);
    }).catch(function(error) {
      res.status(500).json({error: error});
    });
});

// Update a spot
router.put('/:id', function(req, res) {
  Spot.update(req.params.id, req.body).then(function() {
    res.status(204).send();
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Update the rating of a spot
router.put('/rating/:id', function(req, res) {
  if (req.body.hasOwnProperty('rating')) {
    Spot.updateRating(req.params.id, req.body.rating).then(function(data) {
      res.status(200).json({rating: data.snapshot.val().rating});
    }).catch(function(error) {
      res.status(500).json({error: error});
    });
  } else {
    res.status(400).json({error: "Missing expected body parameter."});
  }
});

router.get('/:id/reviews', function(req, res) {
  Spot.getReviews(req.params.id).then(function(spots) {
    res.status(200).json(spots);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

module.exports = router;
