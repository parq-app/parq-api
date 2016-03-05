var Firebase = require('firebase'),
    GeoHash = require('ngeohash'),
    Loc = require('./loc');

var firebaseRef = new Firebase("https://parq.firebaseio.com/spots");

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
      return spot;
  });
};

exports.get = function(spotId) {
  return firebaseRef.child(spotId).once("value").then(function(snapshot) {
    var spotData = snapshot.val();
    return new Spot(spotData.userId, spotData.addr, spotData.geohash,
                    spotData.title, spotData.rating, spotData.numRatings, spotData.costPerHour, snapshot.key());
  });
};

exports.update = function(spotId, attrs) {
  if (spotId == null) return Promise.reject("Null spot ID");

  return firebaseRef.child(spotId).update(attrs);
};

exports.reserve = function(spotId) {
  return firebaseRef.child(spotId).update({"isReserved": true});
};

exports.free = function(spotId) {
  return firebaseRef.child(spotId).update({"isReserved": false});
};

function Spot(userId, addr, geohash, title, rating, numRatings, cost, id) {
  this.id = id;
  this.attributes = {
    userId: userId,
    addr: addr,
    geohash: geohash,
    title: title,
    isReserved: false,
    rating: rating,
    numRatings: numRatings,
    costPerHour: cost
  };
};
exports.Spot = Spot;
module.exports = exports;
