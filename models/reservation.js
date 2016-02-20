var Firebase = require('firebase'),
    geohash = require('ngeohash'),
    geolib = require('geolib'),
    Spot = require('./spot');

var reservationsRef = new Firebase("https://parq.firebaseio.com/reservations");
var locsRef = new Firebase("https://parq.firebaseio.com/locs");
var usersRef = new Firebase("https://parq.firebaseio.com/users");

/* Takes in a latlong and list of locs to find nearest spot */
var findNearestLoc = function(currentLatLong, locsSnapshot) {
    var minLoc, minDistance = Number.MAX_VALUE;
    locsSnapshot.forEach(function(locSnapshot) {
        var tempLoc = locSnapshotToLoc(locSnapshot);
        var tempLatLong = geohash.decode(tempLoc.geohash);
        var tempDistance = geolib.getDistance(tempLoc, currentLatLong);
        if (tempDistance < minDistance) {
            minDistance = tempDistance;
            minLoc = tempLoc;
        }
    });
    return minLoc;
};

/* Converts a firebase loc to a JS object */
var locSnapshotToLoc = function(locSnapshot) {
    return {
        geohash: locSnapshot.key(),
        spotId: locSnapshot.val()
    };
};

/* Remove the provided loc from the free list */
exports.removeLoc = function(loc) {
    return locsRef.child(loc.geohash).remove();
};

/* Add a new loc to the free list */
exports.addLoc = function(loc) {
    return locsRef.child(loc.geohash).set(loc.spotId);
};

/* finds the closest spot from list of open locs,
 * remove the loc from the freelist, and mark
 * its spot as occupied. Will return the occupied spotId */
var occupyNearestSpot = function(locsSnapshot) {
    var loc = findNearestLoc(currentLoc, locsSnapshot);
    return Promise.all([removeLoc(loc), Spot.occupy(spotId)])
        .then(function() {
            return loc.spotId;
        })
};

/* Returns a reservation that has a new reservationId */
var pushNewReservation = function(reservation) {
     var resPromise = reservationsRef.push(reservation);
     return resPromise.then(function() {
         reservation.id = resPromise.key();
         return reservation;
     });
};

var addReservationToActive = function(reservation) {
    return Promise.all([
        usersRef.child(reservation.driverId).child("activeDriverReservations").set({reservation.id: "true"}),
        usersRef.child(reservation.hostId).child("activeHostReservations").set({reservation.id: "true"})
    ]).then(function() {
        return reservation;
    })
};

pushNewReservation({"driverid": "asdf", "userId": "adsf"})
    .then(addReservationToActive)
    .then(function(reservation) {
        console.log(reservation);
    });

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
    return locsRef.once("value")
        .then(occupyNearestSpot)
        .then(Spot.get)
        .then(function(spot) {
            reservation.attributes.hostId = spot.userId;
            reservation.spotId = spot.id;
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
