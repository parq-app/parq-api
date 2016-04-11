var Firebase = require('firebase');
var Spot = require('./spot');
var Reservation = require('./reservation');

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

/* Adds the reservation id to the driver's list of past reservations */
exports.addReservationToDriverPast = function(reservation) {
  var userId = reservation.attributes.driverId;
  var resId = reservation.id;
  var resObject = {};
  resObject[resId] = resId;

  return usersRef.child(userId).child("pastDriverReservations").update(resObject);
}

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

exports.getPastDriverReservations = function(userId) {
  return usersRef.child(userId).child("pastDriverReservations").once("value")
    .then(function(snapshot) {
      var reservations = snapshot.val();
      var reservationIds = Object.keys(reservations);

      return Promise.all(reservationIds.map(function(resId) {
        return Reservation.get(resId)
          .then(function(reservation) {
            // This is extremely jank and I shouldn't be doing it.
            return Spot.get(reservation.attributes.spotId).then(function(spot) {
              reservation.attributes['addr'] = spot.attributes.addr;
              return reservation;
            }); 
          });;       
      }))
      
    });
}

exports.addHostSpot = function(userId, spotId) {
  var spotObj = {};
  spotObj[spotId] = spotId;

  return usersRef.child(userId).child('spots').update(spotObj);
};

exports.create = function(email, uid, firstName, lastName, profilePhotoId) {
  var user = new User(email, uid, firstName, lastName, profilePhotoId);
  return usersRef.child(uid).set(user.attributes).then(function() {
    return user; 
  });
};

exports.get = function(id) {
  return usersRef.child(id).once("value").then(function(snapshot) {
    var userData = snapshot.val();
    var user = new User(userData.email, snapshot.key(), userData.firstName,
                        userData.lastName, userData.profilePhotoId);

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

function User(email, id, firstName, lastName, profilePhotoId) {
  this.id = id;
  this.attributes = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    profilePhotoId: profilePhotoId
  };
}
