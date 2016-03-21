var assert = require('assert');

var Helpers = require('../helpers');

var Reservation = require('../../models/reservation');
var Spot = require('../../models/spot');
var Loc = require('../../models/loc');
var User = require('../../models/user');

var chipotle = {lat: 42.279247, long: -83.740605};
describe('Reservation', function() {
  var users = [];
  this.timeout(15000);

  var refresh = function(done) {
    Helpers.refreshDbWithOneSpotEach().then(function(u) {
      users = u;
      done();
    }).catch(function(error) {
      done(error);
    });
  };

  describe('#reserve()', function() {
    var reservation;
    before(refresh);

    it('creates a new reservation and checks attrs', function(done) {
      Reservation.reserve(users[0], chipotle.lat, chipotle.long)
        .then(function(res) {
          reservation = res;
          assert.equal(reservation.hostId, users[0].id);
          assert.equal(reservation.attributes.status, "reserved");
          done();
        }).catch(function(error) {
          done(error);
        });
    });

    it('checks that the new reservation spot is reserved', function(done) {
      Spot.get(reservation.attributes.spotId)
        .then(function(spot) {
          assert.equal(spot.id, reservation.attributes.spotId);
          assert(spot.attributes.isReserved);
          done();
        }).catch(function(error) {
          done(error);
        });
    });

    it('checks that the reserved loc is not in the free list', function(done) {
      Loc.getAllLocs()
        .then(function(locs) {
          assert(!locs.hasOwnProperty(reservation.attributes.geohash));
          done();
        }).catch(function(error) {
          done(error);
        });
    });
  });

  describe('#occupy()', function() {
    var reservation;
    before(refresh);

    // sets up an already reserved spot
    before(function(done) {
      Reservation.reserve(users[1], chipotle.lat, chipotle.long)
        .then(function(res) {
          reservation = res;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('occupies a new reservation and checks attrs', function(done) {
      Reservation.occupy(reservation.id)
        .then(function(res) {
          reservation = res;
          assert.equal(reservation.attributes.status, "occupied");
          done();
        }).catch(function(err) {
          done(err);
        });
    });

    it('makes sure that the reservationId was added to host', function(done) {
      User.get(reservation.attributes.hostId)
        .then(function(user) {
          assert(user.attributes.hasOwnProperty('activeHostReservations'));
          var hostIdRes = Object.keys(user.attributes.activeHostReservations)[0];
          var resId = user.attributes.activeHostReservations[hostIdRes].reservationId;
          assert.equal(resId, reservation.id);
          done();
        }).catch(function(err) {
          done(err);
        });
    });

    it('makes sure that the reservationId was added to driver', function(done) {
      User.get(reservation.attributes.driverId)
        .then(function(user) {
          assert(user.attributes.hasOwnProperty('activeDriverReservations'));
          var driverIdRes = Object.keys(user.attributes.activeDriverReservations)[0];
          var resId = user.attributes.activeDriverReservations[driverIdRes].reservationId;
          assert.equal(resId, reservation.id);
          done();
        }).catch(function(err) {
          done(err);
        });
    });
  });

  describe('#finish()', function() {
    var reservation;
    before(refresh);

    // sets up an already occupied reservation
    before(function(done) {
      Reservation.reserve(users[2], chipotle.lat, chipotle.long)
        .then(function(res) {
          return Reservation.occupy(res.id);
        })
        .then(function(res) {
          reservation = res;
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('checks finished status on reservation', function(done) {
      Reservation.finish(reservation.id)
        .then(function(res) {
          reservation = res;
          assert.equal(reservation.attributes.status, 'finished');
          assert(!reservation.attributes.reservationId);
          done();
        }).catch(function(err) {
          done(err);
        });
    });

    it('makes sure that the reservationId was removed from host', function(done) {
      User.get(reservation.attributes.hostId)
        .then(function(user) {
          assert(!user.attributes.hasOwnProperty('activeHostReservations'));
          done();
        }).catch(function(err) {
          done(err);
        });
    });

    it('makes sure that the reservationId was removed from driver', function(done) {
      User.get(reservation.attributes.driverId)
        .then(function(user) {
          assert(!user.attributes.hasOwnProperty('activeDriverReservations'));
          done();
        }).catch(function(err) {
          done(err);
        });
    });

    it('checks that the reserved loc is in the free list', function(done) {
      Loc.getAllLocs()
        .then(function(locs) {
          assert(locs.hasOwnProperty(reservation.attributes.geohash));
          done();
        }).catch(function(error) {
          done(error);
        });
    });
  });
});