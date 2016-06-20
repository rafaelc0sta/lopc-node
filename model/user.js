"use strict";
var ObjectId = require('mongodb').ObjectID;

class User {

  collectionName() {
    return "users";
  }

  collection() {
    global.database.collection(this.collectionName());
  }

  constructor(object) {
    for (var property in object) {
      this[property] = object[property];
    }
  }

  save(callback) {
    let users = this.collection();
    users.save(this, {w:1}, callback);
  }

  static validate(user) {
    if (!user.deviceType || !user.deviceToken || !user.app) return false;
    return true;
  }

  static usersForQuery(query, callback) {
    let users = this.collection();

    users.find(query).toArray(function (err, docs) {
      if (!err) {
        callback(null, _createUsersFromDocs(docs));
      } else {
        console.log('Error fetching users: ' + err);
        callback(err, null);
      }
    });
  }
}

function _createUsersFromDocs(docs) {
  var users = [];
  for (userEntry of docs) {
    users.push(new User(userEntry));
  }
  return users;
}

module.exports = User;
