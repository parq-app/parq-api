var Firebase = require('firebase');
var Spot = require('./spot');

var usersRef = new Firebase("https://parq.firebaseio.com/users");

exports.removeReservationFromActive = function(reservation, userType) {
  var resId = reservation.id;
  var userId;
  var listName;

  if (userType === "host") {
    userId = reservation.attributes.hostId;
    listName = "activeHostReservations";
  } else {
    userId = reservation.attributes.driverId;
    listName = "activeDriverReservations";
  }

  return usersRef.child(userId).child(listName).child(resId).remove()
    .then(function() {
      return reservation;
    });
};
/* Removes the reservation id from both driver and hosts corresponding lists */
exports.removeReservationFromHostActive = function(reservation) {
  return exports.removeReservationFromActive(reservation, "host");
};

/* Removes the reservation id from both driver and hosts corresponding lists */
exports.removeReservationFromDriverActive = function(reservation) {
  return exports.removeReservationFromActive(reservation, "driver");
};

/* Adds the reservation id to both driver and hosts corresponding lists */
exports.addReservationToActive = function(reservation) {
  var resObj = {};
  resObj[reservation.id] = reservation.id;

  var driverId = reservation.attributes.driverId;
  var hostId = reservation.attributes.hostId;

  return Promise.all([
    usersRef.child(driverId).child('activeDriverReservations').update(resObj),
    usersRef.child(hostId).child('activeHostReservations').update(resObj)
  ]).then(function() {
    return reservation;
  });
};

exports.addHostSpot = function(userId, spotId) {
  var spotObj = {};
  spotObj[spotId] = spotId;

  return usersRef.child(userId).child('spots').update(spotObj);
};

exports.create = function(email, password, firstName, lastName) {
  var credentials = {email: email, password: password};
  return usersRef.createUser(credentials).then(function(userId) {
    var user = new User(email, userId.uid, firstName, lastName);

    return usersRef.child(userId.uid).set(user.attributes).then(function() {
      return user;
    });
  });
};

exports.get = function(id) {
  return usersRef.child(id).once("value").then(function(snapshot) {
    var userData = snapshot.val();
    var user = new User(userData.email, snapshot.key(), userData.firstName,
                        userData.lastName);

    // fix ctor to do this basically
    user.id = snapshot.key();
    user.attributes = snapshot.val();
    return user;
  });
};

exports.getSpots = function(id) {
  return usersRef.child(id).child("spots").once("value")
    .then(function(snapshot) {
      var spotIdsObj = snapshot.val();
      var spotIdArr = Object.keys(spotIdsObj);
      return Promise.all(spotIdArr.map(function(spotId) {
        return Spot.get(spotId);
      }));
    });
};

exports.update = function(id, attrs) {
  if (id === null) {
    return Promise.reject("Null spot ID");
  }

  // There appears to be a weird bug in Volley that randomly inserts a blank key
  // into your params. This confuses firebase, so delete it if it exists.
  if (attrs.hasOwnProperty("")) {
    delete attrs['']; 
  }
  return usersRef.child(id).update(attrs).then(function() {
    return exports.get(id); 
  });
};

function User(email, id, firstName, lastName) {
  this.id = id;
  this.attributes = {
    email: email,
    firstName: firstName,
    lastName: lastName
  };
}
