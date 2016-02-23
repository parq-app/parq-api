var express = require('express');
var Reservation = require('../models/reservation');

var router = express.Router();

// Create and reserve a new reservation
router.post('/', function(req, res) {
  Reservation.reserve(req.body.userId, req.body.latitude, req.body.longitude)
    .then(function(reservation) {
      res.json(reservation);
    }).catch(function(error) {
      res.status(500).json({error: error});
    });
});

// Occupy spot passed in the id
router.put("/:id/occupy", function(req, res) {
  Reservation.occupy(req.params.id).then(function(reservation) {
    console.log(reservation);
    res.json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Occupy spot passed in the id
router.put("/:id/finish", function(req, res) {
  Reservation.finish(req.params.id).then(function(reservation) {
    res.json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Get a reservation by id
router.get("/:id", function(req, res) {
  Reservation.get(req.params.id).then(function(reservation) {
    res.json(reservation);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

module.exports = router;
