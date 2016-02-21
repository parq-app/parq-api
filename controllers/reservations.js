var express = require('express'),
    router = express.Router(),
    Reservation = require('../models/reservation');

// Create and reserve a new reservation
router.post('/', function(req, res) {
    Reservation.create(req.params.userId, req.params.latitude, req.params.longitude)
        .then(function(reservation) {
            res.json(reservation);
        }).catch(function(error) {
            res.status(500).json({error: error});
        });
});

// Get a reservation by id
router.get("/:id", function(req, res) {
    Reservation.get(req.reservationId).then(function(reservation) {
        res.json(reservation);
    }).catch(function(error) {
        res.status(500).json({error: error});
    });
});
