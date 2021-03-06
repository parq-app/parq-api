var Firebase = require('firebase');
var GeoHash = require('ngeohash');

var Loc = require('./loc');
var User = require('./user');
var Reservation = require('./reservation');

var firebaseRef = new Firebase('https://parq.firebaseio.com/spots');

exports.create = function(userId, addr, lat, long, title) {
  var hash = GeoHash.encode(lat, long);
  // Rating defaults to 0, and for now cost per hour is set to $2.
  var spot = new Spot(userId, addr, hash, title, 0, 0, 2, null);
  var spotRef = firebaseRef.push(spot.attributes);

  return spotRef.then(function() {
    spot.id = spotRef.key();
    return {geohash: spot.attributes.geohash, spotId: spot.id};
  })
  .then(Loc.addLoc)
  .then(function() {
    return User.addHostSpot(spot.attributes.userId, spot.id);
  })
  .then(function() {
    return spot;
  });
};

exports.get = function(spotId) {
  return firebaseRef.child(spotId).once("value").then(function(snapshot) {
    var spotData = snapshot.val();
    var spot = new Spot(spotData.userId, spotData.addr, spotData.geohash,
                    spotData.title, spotData.rating, spotData.numRatings,
                    spotData.costPerHour, snapshot.key());

    // easiest way to get values from firebase, look into cleaning up ctor
    spot.id = snapshot.key();
    spot.attributes = snapshot.val();
    return spot;
  });
};

exports.update = function(spotId, attrs) {
  if (spotId === null) {
    return Promise.reject("Null spot ID");
  }
  return firebaseRef.child(spotId).update(attrs);
};

/* finds the closest spot from list of open locs,
 * remove the loc from the freelist, and mark
 * its spot as occupied. Will return the occupied spotId */
exports.reserveNearestSpot = function(currentLatLong, resId) {
  return Loc.getAllLocs()
    .then(function(locs) {
      var loc = Loc.findNearestLoc(currentLatLong, locs);
      return Promise.all([Loc.removeLoc(loc), exports.reserve(loc.spotId, resId)])
        .then(function() {
          return exports.get(loc.spotId);
        });
    });
};

exports.reserve = function(spotId, reservationId) {
  return exports.get(spotId)
    .then(function(spot) {
      return Promise.all([
        firebaseRef.child(spotId).update({isReserved: true}),
        firebaseRef.child(spotId).update({reservationId: reservationId}),
        Loc.removeLoc({
          geohash: spot.attributes.geohash,
          spotId: spot.id
        })
      ]);
    });
};

exports.free = function(spotId) {
  return exports.get(spotId)
    .then(function(spot) {
      return Promise.all([
        firebaseRef.child(spotId).update({isReserved: false}),
        firebaseRef.child(spotId).child("reservationId").remove(),
        Loc.addLoc({
          geohash: spot.attributes.geohash,
          spotId: spot.id
        })
      ]);
    });
};

exports.review = function(spotId, resId, rating, comment) {
  var reviewObj = {rating: rating, comment: comment};
  return exports.updateRating(spotId, rating)
    .then(function() {
      return firebaseRef.child(spotId).child("reviews").child(resId).update(reviewObj);
    });
};

exports.getReviews = function(spotId) {
  return firebaseRef.child(spotId).child("reviews").once("value")
    .then(function(snapshot) {
      var reviews = snapshot.val();
      var reviewResIds = Object.keys(reviews);
      return reviewResIds.map(function(resId) {
        var review = reviews[resId];
        review.reservationId = resId;
        return review;
      });
    });
};

/* delete the actual spot along with all associated reservations
 * This is "permanent" operation in that it removes traces of the spot
 */
exports.delete = function(spotId) {
  return exports.get(spotId)
    .then(function(spot) {
      var resIds = [];
      if (spot.attributes.isReserved) {
        resIds.push(spot.attributes.reservationId);
      }
      resIds.concat(Object.keys(spot.attributes.reviews || []));
      return Promise.all(resIds.map(function(resId) {
        return Reservation.delete(resId);
      }));
    })
    .then(function() {
      return firebaseRef.child(spotId).remove();
    });
};

exports.updateRating = function(spotId, rating) {
  var newRating = parseFloat(rating);
  return firebaseRef.child(spotId).transaction(function(currentSpot) {
    // Data can be null here because of the way transactions sync w/ local data.
    if (currentSpot === null) {
      // weird workaround to give transaction() a default local value
      return new Spot(0, 0, 0, 0, 0, 0, 0, 0).attributes;
    }

    var oldRating = parseFloat(currentSpot.rating);
    var numRatings = parseInt(currentSpot.numRatings, 10);
    // Calculate new rating:
    // Multiply current rating by number of raters to get sum of all ratings
    var ratingSum = oldRating * numRatings;

    // Add the new rating and then divide by the old number of ratings + 1
    var updatedRating = (ratingSum + newRating) / (numRatings + 1);

    currentSpot.rating = updatedRating;
    currentSpot.numRatings = numRatings + 1;
    return currentSpot;
  });
};

function Spot(userId, addr, geohash, title, rating, numRatings, cost, id) {
  this.id = id;
  this.attributes = {
    userId: userId,
    addr: addr,
    geohash: geohash,
    title: title,
    isReserved: false,
    reservationId: null,
    rating: rating,
    numRatings: numRatings,
    costPerHour: cost
  };
}

exports.Spot = Spot;
module.exports = exports;
