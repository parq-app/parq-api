var Helpers = require('./helpers');

var args = process.argv.slice(2);
var name = null;
if (args.length) {
  name = args[0];
}

Promise.resolve().then(function() {
  if (name) {
    // TODO(matt): do something interesting w/ this
    return Helpers.refreshUser(name);
  }
  return Helpers.refreshDbWithOneSpotEach();
}).then(function() {
  process.exit();
}).catch(function(err) {
  console.log(err.stack);
  process.exit();
});
