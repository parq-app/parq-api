var Firebase = require('firebase');
var Spot = require('../models/spot');
var User = require('../models/user');

var firebaseRef = new Firebase("https://parq.firebaseio.com");

var users = [
  {email: "mrgrossm@umich.edu", password: "mrgrossm", id: "", firstName: "Matt", lastName: "Gross Man"},
  {email: "nickmorg@umich.edu", password: "nickmorg", id: "", firstName: "Nick", lastName: "Mo"},
  {email: "kenzshelley@gmail.com", password: "p", id: "", firstName: "Kenz", lastName: "Shelley"}
];

var removeUsers = function() {
  return Promise.all(users.map(function(user) {
    return firebaseRef.removeUser({email: user.email, password: user.password});
  })).catch(function(error) {});
};

var addUsers = function() {
  return Promise.all(users.map(function(user) {
    return User.create(user.email, user.password, user.firstName, user.lastName);
  })).catch(function(error) {});
};

var addSpots = function() {
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

firebaseRef.remove().catch()
  .then(removeUsers)
  .then(addUsers)
  .then(function(results) {
    for (var i = 0; i < users.length; i++) {
      users[i].id = results[i].id;
    }
  })
  .then(addSpots)
  .catch(function(error) {
    console.log(error);
  }).then(function() {
    process.exit();
  });
