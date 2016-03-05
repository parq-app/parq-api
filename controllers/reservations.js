var express = require('express');
var router = express.Router();
var Reservation = require('../models/reservation');

// Get a reservation by id
router.get("/:id", function(req, res) {
  Reservation.get(req.params.id).then(function(reservation) {
    res.status(200).json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Create and reserve a new reservation
router.post('/', function(req, res) {
  if (!req.body.hasOwnProperty('userId') || !req.body.hasOwnProperty('latitude') ||
     !req.body.hasOwnProperty('longitude')) {
    res.status(400).json({error: "Missing expected body parameter."});
    return;
  }

  Reservation.reserve(req.body.userId, req.body.latitude, req.body.longitude)
    .then(function(reservation) {
      res.status(201).json(reservation);
    }).catch(function(error) {
      res.status(500).json({error: error});
    });
});

// Occupy spot passed in the id
router.put("/:id/occupy", function(req, res) {
  Reservation.occupy(req.params.id).then(function(reservation) {
    res.status(200).json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Finish spot occupation passed in the id
router.put("/:id/finish", function(req, res) {
  Reservation.finish(req.params.id).then(function(reservation) {
    res.status(200).json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

module.exports = router;
