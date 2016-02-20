"use strict";

var express = require('express')
  , router = express.Router(), 
  Firebase = require('firebase'),
  GeoFire = require('geofire'),
  Spot = require('../models/spot');


// Sample Spot code:
//var testSpot = new Spot("userid", "loc", "title");
//console.log(testSpot);
//testSpot.update({userId: "userid2"});
//console.log(testSpot);
//
//testSpot.create().then(function() {
//  console.log(testSpot);
//  testSpot.update({userId: "userid3", title: "newTitle"});
//  console.log(testSpot);
//  testSpot.save().then(function() {
//    console.log(testSpot);
//  }, function(error) {});
//}, function(error) {
//});

router.get('/', function(req, res) {
});

module.exports = router
