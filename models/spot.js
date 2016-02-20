var Firebase = require('firebase'),
    GeoFire = require('geofire');

var firebaseRef = new Firebase("https://parq.firebaseio.com/spots");

exports.create = function(userId, addr, title) {
  var spotRef = firebaseRef.push();
  var spot = new Spot(userId, addr, title, null);

  return spotRef.set(spot.attributes).then(function() {
    console.log("Successfully created spot!");
    spot.id = spotRef.key();
    return spot;
  }, function(error) {
    console.log("Error creating spot! " + error);
  });
}

exports.get = function(spotId) {
  console.log(spotId);
  return firebaseRef.child(spotId).once("value").then(function(snapshot) {
    var spotData = snapshot.val();
    return new Spot(spotData.userId, spotData.addr, spotData.title, snapshot.key());
  });
}

function Spot(userId, addr, title, id) {
  this.id = id;
  this.attributes = {
    userId: userId,
    addr: addr,
    title: title
  }
};

Spot.prototype = {
  // Update the object's attributes and persist to firebase.
  update: function(changedAttrs) {
    // Check that id is not null
    if (!this.id) return false;
    // validate attributes
    for (var attr in changedAttrs) {
      if (!this.attributes.hasOwnProperty(attr)) {
        console.log("Invalid attribute: " + attr)
        return false; 
      }
    }

    return firebaseRef.child(this.id).update(changedAttrs).then(function() {
      // Only actually modify local model after the change is successfully
      // persisted to firebase. 
      for (var attr in changedAttrs) {
        this.attributes[attr] = changedAttrs[attr];
      }
    }, function(error) {});
  },
  getAttr: function(attr) {
    return this.attributes[attr]; 
  },
  hasAttr: function(attr) {
    return this.attributes.hasOwnProperty(attr);
  } 
};

exports.Spot = Spot;

module.exports = exports;
