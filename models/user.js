var Firebase = require('firebase'),
  GeoFire = require('geofire');

var firebaseRef = new Firebase("https://parq.firebaseio.com/users");

exports.create = function(email, password) {
  credentials = {"email": email, "password": password};
  return firebaseRef.createUser(credentials).then(function(userId) {
    var user = new User(email, userId.uid);

    return firebaseRef.child(userId.uid).set(user.attributes).then(function() {
      return user; 
    });
  });
}

exports.get = function(id) {
  return firebaseRef.child(id).once("value").then(function(snapshot) {
    var userData = snapshot.val();
    return new User(userData.email, snapshot.key());
  });
} 

exports.update = function(id, attrs) {
  if (id == null) return Promise.reject("Null spot ID");

  return firebaseRef.child(id).update(attrs);
}


function User(email, id) {
  this.id = id;
  this.attributes = {
    email: email 
  }
}



