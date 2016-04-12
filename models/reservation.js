var Firebase = require('firebase');
var GeoHash = require('ngeohash');

var Spot = require('./spot');
var User = require('./user');

var reservationsRef = new Firebase('https://parq.firebaseio.com/reservations');

/* Returns a reservation that has a new reservationId */
var createNewReservation = function(reservation) {
  var resPromise = reservationsRef.push(reservation.attributes);
  return resPromise.then(function() {
    reservation.id = resPromise.key();
    return reservation;
  });
};

var calculateCost = function(timeStart, timeEnd, rate) {
  var diffInMillis = timeEnd - timeStart;
  var diffInHours = diffInMillis / (1000 * 60 * 60);

  return diffInHours * rate ;
}

var setCost = function(reservation) {
  return Spot.get(reservation.attributes.spotId).then(function(spot) {
    var cost = calculateCost(reservation.attributes.timeStart,
                             reservation.attributes.timeEnd,
                             spot.attributes.costPerHour);

    return reservationsRef.child(reservation.id).update({cost: cost})
      .then(function() {
        return exports.get(reservation.id); 
      });
  });
};

var setTime = function(reservation, timeType) {
  var timeObj = {};
  timeObj[timeType] = Firebase.ServerValue.TIMESTAMP;
  return reservationsRef.child(reservation.id).update(timeObj)
    .then(function() {
      return exports.get(reservation.id);
    });
};

var setEndTime = function(reservation) {
  return setTime(reservation, "timeEnd");
};

var setStartTime = function(reservation) {
  return setTime(reservation, "timeStart");
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
/* create new reservation
 * reserve nearest spot
 * return updated reservation
 */
exports.reserve = function(driverId, latitude, longitude) {
  var reservation = new Reservation(driverId);
  var currentLatLong = {latitude: latitude, longitude: longitude};
  return createNewReservation(reservation)
    .then(function(res) {
      reservation.id = res.id;
      return Spot.reserveNearestSpot(currentLatLong, reservation.id);
    })
    .then(function(spot) {
      var spotLatLong = GeoHash.decode(spot.attributes.geohash);
      reservation.attributes.geohash = spot.attributes.geohash;
      reservation.attributes.latitude = spotLatLong.latitude;
      reservation.attributes.longitude = spotLatLong.longitude;
      reservation.attributes.hostId = spot.attributes.userId;
      reservation.attributes.spotId = spot.id;
      return reservationsRef.child(reservation.id).update(reservation.attributes);
    })
    .then(function() {
      return exports.get(reservation.id);
    });
};

/* Change status to accepted and add to active lists */
exports.accept = function(reservationId) {
  return exports.updateStatus(reservationId, exports.ReservationStatusEnum.accepted)
    .then(User.addReservationToActive);
};

/* Change status to occupied and start price timer */
exports.occupy = function(reservationId) {
  return exports.updateStatus(reservationId, exports.ReservationStatusEnum.occupied)
    .then(setStartTime);
};

/* Change status to finished, remove from driver list,
 * end occupied time, add to free locs, and modify Spot */
exports.finish = function(reservationId) {
  return exports.updateStatus(reservationId, exports.ReservationStatusEnum.finished)
    .then(function(reservation) {
      return Promise.all([
        setEndTime(reservation),
        User.removeReservationFromHostActive(reservation),
        Spot.free(reservation.attributes.spotId)
      ]);
    })
    .then(function() {
      return exports.get(reservationId);
    })
    .then(function(reservation) {
      return setCost(reservation); 
    });
};

exports.review = function(reservationId, rating, comment) {
  var reservation;
  return exports.updateStatus(reservationId, exports.ReservationStatusEnum.reviewed)
    .then(function(res) {
      reservation = res;
      return Promise.all([
        Spot.review(reservation.attributes.spotId, reservationId, rating, comment),
        User.removeReservationFromDriverActive(reservation),
        User.addReservationToDriverPast(reservation)
      ]);
    })
    .then(function() {
      return exports.get(reservationId);
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

exports.delete = function(reservationId) {
  return reservationsRef.child(reservationId).remove();
};

exports.ReservationStatusEnum = {
  reserved: 'reserved',
  accepted: 'accepted',
  occupied: 'occupied',
  finished: 'finished',
  reviewed: 'reviewed',
  cancelled: 'cancelled'
};

/* Reservation constructor function */
function Reservation(driverId) {
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
    geohash: null
  };
}
