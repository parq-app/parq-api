var Firebase = require('firebase'),
    GeoFire = require('geofire');

exports.createSpot = function(userId, addr, title) {

}

exports.get = function(spotId) {

}

function Spot(userId, addr, title) {
  this.id = null;
  // Records local changes to the model
  this.changes = {};
  // Indicates whether or not the model has unsaved changes
  this.isClean = true;
  this.attributes = {
    userId: userId,
    addr: addr,
    title: title
  }
};

Spot.prototype = {
  firebaseRef: new Firebase("https://parq.firebaseio.com/spots"),
  // Changes the model's internal representation -- does not persist to fb.
  update: function(changedAttrs) {
    for (var attr in changedAttrs) {
      // validate attributes
      if (!this.attributes.hasOwnProperty(attr)) {
        console.log("Invalid attribute: " + attr)
        return false; 
      }

      // record the change
      this.changes[attr] = [this.attributes[attr], changedAttrs[attr]];
      this.attributes[attr] = changedAttrs[attr];
    }
    this.isClean = false;
  },
  // Persist any changes on the model to firebase.
  save: function() {
    if (Object.keys(this.changes).length == 0) return false;
    var changedAttrs = {};
    for (var attr in this.changes) {
      changedAttrs[attr] = this.changes[attr][1];
    }
    var spotObj = this;
    return this.firebaseRef.child(this.id).update(changedAttrs).then(function() {
      spotObj.isClean = true; 
      spotObj.changes = {}; 
    }, function(error) {});
  },
  // If this object has not yet been created in fb, creates it.
  create: function() {
    var spotRef = this.firebaseRef.push()
    var spotObj = this;
    return spotRef.set(this.attributes).then(function() {
      console.log("Successfully created spot!");
      spotObj.id = spotRef.key();
      spotObj.changes = {};
      spotObj.isClean = true;
      //var geoFire = new GeoFire(firebaseRef);
      // Add to geofire
      //geoFire.set("a_key", [20.0, 10.0]).then(function() {
      //  console.log("yay"); 
      //  res.send("Stored a location!")
      //}, function(error) {
      //  console.log("poop");
      //});
    }, function(error) {
      console.log("Error creating spot!");
    });
  },
  getAttr: function(attr) {
    return this.attributes[attr]; 
  },
  hasAttr: function(attr) {
    return this.hasOwnProperty(attr);
  } 
};

module.exports = Spot;
