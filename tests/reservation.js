var Firebase = require('Firebase'),
    Reservation = require('../models/reservation'),
    Helpers = require('./helpers');

var chipotle = {lat: 42.279247, long: -83.740605};

var users = [];
Helpers.getUsers()
    .then(function(userVals) {
        users = userVals;
    })
    .then(function() {
        // must do in this function to ensure it isn't run until users is populated
        return Reservation.create(users[2], chipotle.lat, chipotle.long)
    })
    .then(function(reservation) {
        console.log("Successful reservation creation: " + JSON.stringify(reservation));
    }).catch(function(error) {
        console.log("Failed reservation creation: " + error);
    });
