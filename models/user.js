var Firebase = require('firebase');
var Spot = require('./spot');

var firebaseRef = new Firebase("https://parq.firebaseio.com/users");

exports.addHostSpot = function(userId, spotId) {
  var spotObj = {};
  spotObj[spotId] = {spotId: spotId};

  return firebaseRef.child(userId).child('spots').update(spotObj);
};

exports.create = function(email, password) {
  var credentials = {email: email, password: password};
  return firebaseRef.createUser(credentials).then(function(userId) {
    var user = new User(email, userId.uid);

    return firebaseRef.child(userId.uid).set(user.attributes).then(function() {
      return user;
    });
  });
};

exports.get = function(id) {
  return firebaseRef.child(id).once("value").then(function(snapshot) {
    var userData = snapshot.val();
    var user = new User(userData.email, snapshot.key());

    // fix ctor to do this basically
    user.id = snapshot.key();
    user.attributes = snapshot.val();
    return user;
  });
};

exports.getSpots = function(id) {
  return firebaseRef.child(id).child("spots").once("value")
    .then(function(snapshot) {
      var spotIdsObj = snapshot.val();
      var spotIdArr = Object.keys(spotIdsObj).map(function(spotId) {
        return spotIdsObj[spotId].spotId;
      });

      return Promise.all(spotIdArr.map(function(spotId) {
        return Spot.get(spotId);
      }));
    });
};

exports.update = function(id, attrs) {
  if (id === null) {
    return Promise.reject("Null spot ID");
  }
  return firebaseRef.child(id).update(attrs);
};

function User(email, id) {
  this.id = id;
  this.attributes = {
    email: email
  };
}
