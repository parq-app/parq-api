var Firebase = require('firebase'),
    geohash = require('ngeohash'),
    Spot = require('./spot'),
    Loc = require('./loc');

var reservationsRef = new Firebase("https://parq.firebaseio.com/reservations");
var usersRef = new Firebase("https://parq.firebaseio.com/users");

/* finds the closest spot from list of open locs,
 * remove the loc from the freelist, and mark
 * its spot as occupied. Will return the occupied spotId */
var occupyNearestSpot = function(currentLoc, locs) {
    var loc = Loc.findNearestLoc(currentLoc, locs);
    return Promise.all([Loc.removeLoc(loc), Spot.occupy(loc.spotId)])
        .then(function() {
            return loc.spotId;
        })
};

/* Returns a reservation that has a new reservationId */
var pushNewReservation = function(reservation) {
    var resPromise = reservationsRef.push(reservation.attributes);
    return resPromise.then(function() {
        reservation.id = resPromise.key();
        return reservation;
    });
};

/* Adds the reservation id to both driver and hosts responding lists */
var addReservationToActive = function(reservation) {
    var reservationIdObj = {};
    reservationIdObj[reservation.id] = "true";

    return Promise.all([
        usersRef.child(reservation.attributes.driverId).child("activeDriverReservations").set(reservationIdObj),
        usersRef.child(reservation.attributes.hostId).child("activeHostReservations").set(reservationIdObj)
    ]).then(function() {
        return reservation;
    });
};

/* Promise that returns a populated and locked Reservation */
/* get all the locs
 * find the nearest loc
 * remove the loc from the list
 * mark the spotId as taken
 * add reservation to driver's and host's activeReservations
 */
exports.create = function(driverId, latitude, longitude) {
    var reservation = new Reservation(driverId, latitude, longitude);
    var currentLoc = {"latitude": latitude, "longitude": longitude};
    return Loc.getAllLocs().then(function(locs) {
        return occupyNearestSpot(currentLoc, locs);
    })
        .then(Spot.get)
        .then(function(spot) {
            reservation.attributes.hostId = spot.attributes.userId;
            reservation.attributes.spotId = spot.id;
            return reservation;
        }).then(pushNewReservation)
        .then(addReservationToActive)
        .then(function(reservation) {
            return reservation;
        });
};

function Reservation(driverId, latitude, longitude) {
    this.id = null;
    this.attributes = {
        driverId: driverId,
        hostId: null,
        spotId: null,
        timeStart: Firebase.ServerValue.TIMESTAMP,
        timeEnd: null,
        geohash: geohash.encode(latitude, longitude)
    };
}
