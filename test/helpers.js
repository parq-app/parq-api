var Firebase = require('firebase');
var Spot = require('../models/spot');
var User = require('../models/user');

var firebaseRef = new Firebase('https://parq.firebaseio.com');
var usersRef = firebaseRef.child("users");

var users = {
  matt: {
    email: "mrgrossm@umich.edu",
    password: "m",
    firstName: "Matt",
    lastName: "Gross Man",
    id: ""
  },
  nick: {
    email: "nickmorg@umich.edu",
    password: "n",
    firstName: "Nick",
    lastName: "Mo",
    id: ""
  },
  kenz: {
    email: "kenzshelley@gmail.com",
    password: "p",
    firstName: "Kenz",
    lastName: "Smelley",
    id: ""
  }/*,
  m: {
    email: "m@m.com",
    password: "m",
    firstName: "Matt",
    lastName: "McSwagMaster",
    id: ""
  },
  k: {
    email: "k@k.com",
    password: "k",
    firstName: "Kenz",
    lastName: "McTurtle",
    id: ""
  },
  n: {
    email: "n@n.com",
    password: "n",
    firstName: "Nick",
    lastName: "McPlanatir",
    id: ""
  }*/
};

// Tries to delete a given user, catching an error if it happens
exports.removeUserWithName = function(name) {
  var email = users[name].email;
  var password = users[name].password;
  return firebaseRef.removeUser({email: email, password: password})
    .catch(function() {});
};

exports.removeUsers = function() {
  return Promise.all(Object.keys(users).map(function(name) {
    return exports.removeUserWithName(name);
  })).catch(function() {});
};

exports.addUserWithName = function(name) {
  var info = users[name];
  return firebaseRef.createUser({email: info.email, password: info.password})
    .then(function(cred) {
      return User.create(
          info.email, cred.uid, info.firstName, info.lastName, "none"
      );
    });
};

exports.addUsers = function() {
  return Promise.all(Object.keys(users).map(function(name) {
    return exports.addUserWithName(name);
  }));
};

exports.addSpots = function() {
  return Promise.all([
    Spot.create(users.matt.id,
      "1111 South Forest Ave., Ann Arbor, MI 48104",
      42.268629, -83.732678,
      "Matt's house"),
    Spot.create(users.nick.id,
      "916 Mary St., Ann Arbor, MI 48104",
      42.270427, -83.742233,
      "Nick's House"),
    Spot.create(users.kenz.id,
      "210 North Thayer St., Ann Arbor, MI 48104",
      42.282546, -83.739348,
      "Kenz's House")
  ]);
};

exports.fillUserIdWithName = function(name) {
  return firebaseRef.authWithPassword(users[name])
    .then(function(authData) {
      users[name].id = authData.uid;
      return authData.uid;
    })
    .catch(function() {});
};

exports.fillUserIds = function() {
  return Promise.all(Object.keys(users).map(function(name) {
    return exports.fillUserIdWithName(name);
  }));
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
    .then(exports.fillUserIds)
    .then(exports.addSpots)
    .then(exports.getUsers);
};

exports.refreshUser = function(name) {
  exports.fillUserIds()
    .then(function() {
      /* free up reservatin this user currently has */
      return 5;
    })
    .then(function() {
      return exports.removeUserWithName(name);
    })
    .then(function() {
      return User.getSpots(users[name].id);
    })
    .then(function(spots) {
      return Promise.all(spots.map(function(spot) {
        return Spot.delete(spot.id);
      }));
    })
    .then(function() {

      /*
      return exports.addUser()
      */

    });
};

