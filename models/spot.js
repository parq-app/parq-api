var Firebase = require('firebase');

var firebaseRef = new Firebase("https://parq.firebaseio.com/spots");

exports.create = function(userId, addr, geohash, title) {
  var spotRef = firebaseRef.push();
  var spot = new Spot(userId, addr, title, null);

  return spotRef.set(spot.attributes).then(function() {
    spot.id = spotRef.key();
    return spot;
  });
}

exports.get = function(spotId) {
  return firebaseRef.child(spotId).once("value").then(function(snapshot) {
    var spotData = snapshot.val();
    return new Spot(spotData.userId, spotData.addr, spotData.title, snapshot.key());
  });
}

exports.update = function(spotId, attrs) {
  // Check that id is not null
  if (spotId == null) return Promise.reject("Null spot ID");

  return firebaseRef.child(spotId).update(attrs);
};

exports.occupy = function(spotId) {
    return firebaseRef.child(spotId).set({"is_occupied": true});
};

exports.Spot = function Spot(userId, addr, geohash, title, id) {
  this.id = id;
  this.attributes = {
    userId: userId,
    addr: addr,
    geohash: geohash,
    title: title,
    isOccupied: false
  }
};

module.exports = exports;
