var Helpers = require('./helpers');

Helpers.refreshDbWithOneSpotEach()
  .then(function() {
    process.exit();
  }).catch(function(err) {
    console.log(err.stack);
    process.exit();
  });
