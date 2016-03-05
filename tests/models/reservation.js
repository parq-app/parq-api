var assert = require('assert');

var Helpers = require('../helpers');

var Reservation = require('../../models/reservation');
var Spot = require('../../models/spot');
var Loc = require('../../models/loc');

var chipotle = {lat: 42.279247, long: -83.740605};
describe('Reservation', function() {
  var users = [];
  this.timeout(15000);
  before(function(done) {
    Helpers.refreshDbWithOneSpotEach().then(function(u) {
      users = u;
      done();
    }).catch(function(error) {
      done(error);
    });
  });

  describe('#reserve()', function() {
    var reservation;

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
          assert(!locs.hasOwnProperty(reservation.geohash));
          done();
        }).catch(function(error) {
          done(error);
        });
    });
  });
});
