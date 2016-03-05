var Firebase = require('firebase'),
    GeoHash = require('ngeohash'),
    GeoLib = require('geolib');
  

var locsRef = new Firebase("https://parq.firebaseio.com/locs");

/* Remove the provided loc from the free list */
exports.removeLoc = function(loc) {
    return locsRef.child(loc.geohash).remove();
};

/* Add a new loc to the free list */
exports.addLoc = function(loc) {
    return locsRef.child(loc.geohash).set(loc.spotId);
};

/* Takes in a latlong and list of locs to find nearest spot */
exports.findNearestLoc = function(currentLatLong, locs) {
    var minLoc, minDistance = Number.MAX_VALUE;
    for (var key in locs) {
        var tempLoc = {geohash: key, spotId: locs[key]};
        var tempLatLong = GeoHash.decode(tempLoc.geohash);
        var tempDistance = GeoLib.getDistance(tempLatLong, currentLatLong);
        if (tempDistance < minDistance) {
            minDistance = tempDistance;
            minLoc = tempLoc;
        }
    }
    return minLoc;
};

/* Returns a snapshot of the free locs */
exports.getAllLocs = function() {
    return locsRef.once("value").then(function(snapshot) {
      if (!snapshot.exists()) {
        throw new Error("No locations found");
      }
        return snapshot.val();
    })
};
