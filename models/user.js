var Firebase = require('firebase'),
    GeoFire = require('geofire');

var userRef = new Firebase("https://parq.firebaseio.com/users");

exports.createUser = function(username, password){
    credentials = {"username": username, "password": password};
    return userRef.createUser(credentials)
}



