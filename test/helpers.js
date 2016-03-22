var Firebase = require('firebase');
var Spot = require('../models/spot');
var User = require('../models/user');

var firebaseRef = new Firebase('https://parq.firebaseio.com');
var usersRef = firebaseRef.child("users");

var users = [
  {email: "mrgrossm@umich.edu", password: "m", id: "", firstName: "Matt", lastName: "Gross Man"},
  {email: "nickmorg@umich.edu", password: "n", id: "", firstName: "Nick", lastName: "Mo"},
  {email: "kenzshelley@gmail.com", password: "p", id: "", firstName: "Kenz", lastName: "Shelley"}
];

// Tries to delete a given user, catching an error if it happens
exports.removeUser = function(email, password) {
  return firebaseRef.removeUser({email: email, password: password})
    .catch(function() {});
};

exports.removeUsers = function() {
  return Promise.all(users.map(function(user) {
    return exports.removeUser(user.email, user.password);
  })).catch(function() {});
};

exports.addUsers = function() {
  return Promise.all(users.map(function(user) {
    return User.create(user.email, user.password, user.firstName, user.lastName);
  })).catch(function() {});
};

exports.addSpots = function() {
  return Promise.all([
    Spot.create(users[0].id,
      "1111 South Forest Ave., Ann Arbor, MI 48104",
      42.268629, -83.732678,
      "Matt's house"),
    Spot.create(users[1].id,
      "916 Mary St., Ann Arbor, MI 48104",
      42.270427, -83.742233,
      "Nick's House"),
    Spot.create(users[2].id,
      "210 North Thayer St., Ann Arbor, MI 48104",
      42.282546, -83.739348,
      "Kenz's House")
  ]);
};

exports.getUsers = function() {
  return usersRef.once("value").then(function(snapshot) {
    var snapshotJson = snapshot.val();
    var idArray = [];
    for (var key in snapshotJson) {
      if (snapshotJson.hasOwnProperty(key)) {
        idArray.push(key);
      }
    }
    return idArray;
  });
};

exports.refreshDbWithOneSpotEach = function() {
  return firebaseRef.remove()
    .then(exports.removeUsers)
    .then(exports.addUsers)
    .then(function(results) {
      for (var i = 0; i < users.length; i++) {
        users[i].id = results[i].id;
      }
    })
    .then(exports.addSpots)
    .then(exports.getUsers);
};
