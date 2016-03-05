var Firebase = require('firebase');
var GeoHash = require('ngeohash');

var Spot = require('./spot');
var Loc = require('./loc');

var reservationsRef = new Firebase('https://parq.firebaseio.com/reservations');
var usersRef = new Firebase('https://parq.firebaseio.com/users');

/* finds the closest spot from list of open locs,
 * remove the loc from the freelist, and mark
 * its spot as occupied. Will return the occupied spotId */
var reserveNearestSpotId = function(currentLatLong, locs) {
  var loc = Loc.findNearestLoc(currentLatLong, locs);
  return Promise.all([Loc.removeLoc(loc), Spot.reserve(loc.spotId)])
    .then(function() {
      return loc.spotId;
    });
};

/* Returns a reservation that has a new reservationId */
var createNewReservation = function(reservation) {
  var resPromise = reservationsRef.push(reservation.attributes);
  return resPromise.then(function() {
    reservation.id = resPromise.key();
    return reservation;
  });
};

/* Adds the reservation id to both driver and hosts corresponding lists */
var addReservationToActive = function(reservation) {
  var resObj = {};
  resObj[reservation.id] = 'true';

  var driverId = reservation.attributes.driverId;
  var hostId = reservation.attributes.hostId;

  return Promise.all([
    usersRef.child(driverId).child('activeDriverReservations').set(resObj),
    usersRef.child(hostId).child('activeHostReservations').set(resObj)
  ]).then(function() {
    return reservation;
  });
};

var setTime = function(reservation, timeType) {
  var timeObj = {};
  timeObj[timeType] = Firebase.ServerValue.TIMESTAMP;
  return reservationsRef.child(reservation.id).update(timeObj)
    .then(function() {
      return reservation;
    });
};

var setEndTime = function(reservation) {
  return setTime(reservation, "timeEnd");
};

var setStartTime = function(reservation) {
  return setTime(reservation, "timeStart");
};

/* Removes the reservation id from both driver and hosts corresponding lists */
var removeReservationFromActive = function(reservation) {
  var resId = reservation.id;
  var driverId = reservation.attributes.driverId;
  var hostId = reservation.attributes.hostId;

  return Promise.all([
    usersRef.child(driverId).child('activeDriverReservations').child(resId).remove(),
    usersRef.child(hostId).child('activeHostReservations').child(resId).remove()
  ]).then(function() {
    return reservation;
  });
};

/* Change the status of a reservation and return the new obj */
exports.updateStatus = function(reservationId, status) {
  if (status in exports.ReservationStatusEnum) {
    return reservationsRef.child(reservationId).update({status: status})
      .then(function() {
        return exports.get(reservationId);
      });
  }
  throw new Error('errorStatusNotFound');
};

/* Promise that returns a populated and locked Reservation */
/* get all the locs
 * find the nearest loc
 * remove the loc from the list
 * mark the spotId as taken
 */
exports.reserve = function(driverId, latitude, longitude) {
  var reservation = new Reservation(driverId, latitude, longitude);
  var currentLatLong = {latitude: latitude, longitude: longitude};
  return Loc.getAllLocs()
    .then(function(locs) {
      return reserveNearestSpotId(currentLatLong, locs);
    })
    .then(Spot.get)
    .then(function(spot) {
      var spotLatLong = GeoHash.decode(spot.attributes.geohash);
      reservation.attributes.geohash = spot.attributes.geohash;
      reservation.attributes.latitude = spotLatLong.latitude;
      reservation.attributes.longitude = spotLatLong.longitude;
      reservation.attributes.hostId = spot.attributes.userId;
      reservation.attributes.spotId = spot.id;
      return reservation;
    })
    .then(createNewReservation);
};

/* Change status to navigating */
exports.accept = function(reservationId) {
  return exports.updateStatus(reservationId, 'navigating');
};

/* Change status to occupied and add to active lists */
exports.occupy = function(reservationId) {
  return exports.updateStatus(reservationId, 'occupied')
    .then(setStartTime)
    .then(addReservationToActive);
};

/* Change reservation status, remove from both of the active lists */
exports.finish = function(reservationId) {
  return exports.updateStatus(reservationId, 'finished')
    .then(setEndTime)
    .then(function(reservation) {
      return Promise.all([
        removeReservationFromActive(reservation),
        Spot.free(reservation.attributes.spotId)
      ]);
    });
};

exports.get = function(reservationId) {
  return reservationsRef.child(reservationId).once('value')
    .then(function(snapshot) {
      var tempReservation = new Reservation(); // TODO(matt): super uggo, find a new way to fix constructor pattern
      tempReservation.id = snapshot.key();
      tempReservation.attributes = snapshot.val();
      return tempReservation;
    });
};

exports.ReservationStatusEnum = {
  reserved: 'reserved',
  navigating: 'navigating',
  occupied: 'occupied',
  finished: 'finished',
  cancelled: 'cancelled'
};

/* Reservation constructor function */
function Reservation(driverId, latitude, longitude) {
  this.id = null;
  this.attributes = {
    driverId: driverId,
    hostId: null,
    spotId: null,
    status: 'reserved',
    timeRequested: Firebase.ServerValue.TIMESTAMP,
    timeStart: null,
    timeEnd: null,
    latitude: null,
    longitude: null,
    geohash: GeoHash.encode(latitude, longitude)
  };
}
