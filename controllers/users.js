var express = require('express'),
  Firebase = require('firebase'),
  router = express.Router(),
  User = require('../models/user');

var firebaseRef = new Firebase("https://parq.firebaseio.com");

// Get a User
router.get('/:id', function(req, res) {
  User.get(req.params.id).then(function(user) {
    res.status(200).json({user: user});
  }).catch(function(error) {
    res.status(500).json({error: error}); 
  });
});

// Create a new User.
router.post('/', function(req, res) {
  if (req.body.hasOwnProperty('email') && req.body.hasOwnProperty('password')) {
    User.create(req.body.email, req.body.password).then(function(user) {
      res.json({user: user}); 
    }).catch(function(error) {
      res.status(500).json({error: error});
    });
  } else {
    res.status(400).json({error: "Missing expected body parameter."})
  }
});

// Update a user
router.put('/:id', function(req, res) {
  User.update(req.params.id, req.body).then(function() {
    res.status(204).send(); 
  }).catch(function(error) {
    res.status(500).json({error: error});  
  });
});

module.exports = router;
