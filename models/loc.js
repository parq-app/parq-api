var Firebase = require('firebase'),
    geohash = require('ngeohash'),
    geolib = require('geolib');

var locsRef = new Firebase("https://parq.firebaseio.com/locs");

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

/* Takes in a latlong and list of locs to find nearest spot */
exports.findNearestLoc = function(currentLatLong, locsSnapshot) {
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

/* Returns a snapshot of the free locs */
exports.getAllLocs = function() {
    return locsRef.once("value");
}
