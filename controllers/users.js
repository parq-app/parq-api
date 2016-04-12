var express = require('express');
var router = express.Router();
var User = require('../models/user');

// Get a user by id
router.get('/:id', function(req, res) {
  User.get(req.params.id).then(function(user) {
    res.status(200).json(user);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

router.get('/:id/spots', function(req, res) {
  User.getSpots(req.params.id).then(function(spots) {
    res.status(200).json(spots);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Create a new user
router.post('/', function(req, res) {
  if (!req.body.hasOwnProperty('email') ||
      !req.body.hasOwnProperty('uid') ||
        !req.body.hasOwnProperty('firstName') ||
          !req.body.hasOwnProperty('lastName' ||
            !req.body.hasOwnProperty('profilePhotoId'))) {
    res.status(400).json({error: "Missing expected body parameter."});
    return;
  }

  User.create(req.body.email, req.body.uid, req.body.firstName,
              req.body.lastName, req.body.profilePhotoId).then(function(user) {
    res.status(201).json(user);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Update a user
router.put('/:id', function(req, res) {
  User.update(req.params.id, req.body).then(function(user) {
    res.status(200).json(user);
  }).catch(function(error) {
    res.status(500).json({error: error});
  });
});

// Return an array of the user's past reservations
router.get('/:id/pastDriverReservations', function(req, res) {
  User.getPastDriverReservations(req.params.id).then(function(reservations) {
    res.status(200).json(reservations); 
  }).catch(function(error) {
    res.status(500).json({error: error}); 
  });
});

module.exports = router;
