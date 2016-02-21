var Firebase = require('firebase'),
    GeoHash = require('ngeohash'),
    Loc = require('./loc');

var firebaseRef = new Firebase("https://parq.firebaseio.com/spots");

exports.create = function(userId, addr, lat, long, title) {
  var hash = GeoHash.encode(lat, long);
  var spot = new Spot(userId, addr, hash, title, null);
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
    return new Spot(spotData.userId, spotData.addr, spotData.geohash, spotData.title, snapshot.key());
  });
};

exports.update = function(spotId, attrs) {
  // Check that id is not null
  if (spotId == null) return Promise.reject("Null spot ID");

  return firebaseRef.child(spotId).update(attrs);
};

exports.occupy = function(spotId) {
    return firebaseRef.child(spotId).update({"isOccupied": true});
};

function Spot(userId, addr, geohash, title, id) {
  this.id = id;
  this.attributes = {
    userId: userId,
    addr: addr,
    geohash: geohash,
    title: title,
    isOccupied: false
  };
};
exports.Spot = Spot;
module.exports = exports;
