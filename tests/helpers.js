var Firebase = require('Firebase');

var usersRef = new Firebase("https://parq.firebaseio.com/users");

exports.getUsers = function() {
    return usersRef.once("value").then(function(snapshot) {
        var snapshotJson = snapshot.val();
        var idArray = [];
        for (var key in snapshotJson){
            idArray.push(key);
        }
        return idArray;
    });
};


