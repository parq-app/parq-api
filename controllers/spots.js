var express = require('express')
  , router = express.Router(), 
  Firebase = require('firebase'),
  GeoFire = require('geofire');

router.get('/', function(req, res) {
  var firebaseRef = new Firebase("https://parq.firebaseio.com/geo");
  var geoFire = new GeoFire(firebaseRef);
  
  geoFire.set("a_key", [20.0, 10.0]).then(function() {
    console.log("yay"); 
    res.send("Stored a location!")
  }, function(error) {
    console.log("poop"); 
  })
});

module.exports = router
