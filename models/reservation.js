var Firebase = require('firebase'),
    geohash = require('ngeohash'),
    geolib = require('geolib'),
    Spot = require('spot');

var reservationRef = new Firebase("https://parq.firebaseio.com/spots")
var locRef = new Firebase("https://parq.firebaseio.com/locs")

var findNearestLoc = function(currentLoc, locs) {
    var minLoc, minDistance = Number.MAX_VALUE;
    locs.forEach(function(loc) {
        var tempLoc = geohash.decode(loc.key());
        var tempDistance = geolib.getDistance(tempLoc, currentLoc);
        if (tempDistance < minDistance) {
            minDistance = tempDistance;
            minLoc = loc;
        }
    });
    return minLoc;
}

var removeLoc(loc) {
    return locRef.child(loc.key()).remove();
}

var 
/* Promise that returns a populated and locked Reservation */
/* get all the locs
 * find the nearest loc
 * remove the loc from the list
 * mark the spotId as taken
 */
exports.create = function(userId, latitude, longitude) {
    var reservation = new Reservation(userId, latitude, longitude);
    var currentLoc = {"latitude": latitude, "longitude": longitude};
    return locRef.once("value").then(function(snapshot) {
        var loc = findNearestLoc(currentLoc, snapshot);
        reservation.attributes.spotId = loc.value();
        return Promise.all([removeLoc(loc), Spot.occupy(loc)]);
    }).then(function(spotId) {
        return reservationRef.push(reservation);

    }). then(function(reservation))

}
function Reservation(userId, latitude, longitude) {
    this.id = null;
    this.attributes = {
        userId: userId,
        timeStart: Firebase.ServerValue.TIMESTAMP,
        timeEnd: null,
        geohash: geohash.encode(latitude, longitude)
    };
}
