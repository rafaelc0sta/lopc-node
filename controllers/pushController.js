"use strict";

var ApplePushNotificationService = require('../lib/apns');

var App = require('../model/app');
var User = require('../model/user');

var ObjectId = require('mongodb').ObjectId;

class PushController {
  static fetchAll(req, res) {
    // TODO: This
    // Some clients need to have their pushes fetched.
    // This method will enable that behaviour

    var appId = req.query.appId;
    var deviceToken = req.query.deviceToken;
    var appSecret = req.query.appSecret;

    User.usersForQuery({deviceToken : deviceToken, deviceOS: "Android"}, true, function (err, users) {
      if (err) {
        res.status(500).json({result : 'NOK', error: err});
      } else {
        if (users.length != 1) {
          res.status(400).json({result: 'NOK', error: 'Too many/few users found.'});
        } else {

        }
      }
    });
  }
  static send(req, res) {
    var query = req.body.query;
    var payload = req.body.payload;
    var appId = req.query.appId;
    var env = req.query.env;

    var actualSendCallback = function (err, sentPayload) {
      if (err) {
        res.json({result: 'NOK', error: err});
      } else {
        res.json({result: 'OK'});
      }
    }

    if (!ApplePushNotificationService.hasConnection(appId+"-"+env)) {
      App.appsForQuery({_id : new ObjectId(appId)}, true, function (err, apps) {
        if (err || apps.length != 1) {
          res.json({result: 'NOK', error: 'Error fetching app from database'});
        } else {
          var app = apps[0];
          var certificate;
          if (env == "d") certificate = app.developmentPushCertificate.buffer;
          else if (env == "p") certificate = app.productionPushCertificate.buffer;

          var isProd = false;
          if (env == "p") isProd = true;

          ApplePushNotificationService.connect(appId+"-"+env, {
            pfx: certificate,
            port: 2195,
            production: isProd
          });

          _actualSend(appId, env, query, payload, actualSendCallback);
        }
      });
    } else {
      _actualSend(appId, env, query, payload, actualSendCallback);
    }
  }

}

function _actualSend(appId, env, query, payload, callback) {
  if (query.id) {
    var queryId = query.id;
    delete query.id;
    query._id = new ObjectId(queryId);
  }

  User.usersForQuery(query, true, function (err, users) {
    if (err || users.length == 0) {
      res.json({result: 'NOK', error: 'Error fetching user(s) from database'});
    } else {
      for (var user of users) {

        if (user.deviceOS == "iPhone OS") {
          _actualSendApple(appId, env, user, payload, callback);
        } else if (user.deviceOS == "Android") {
          _actualSendAndroid(appId, user, payload, callback);
        } else {
          callback('Unsupported device OS for user' + user._id, null);
        }
      }
    }
  });
}

function _actualSendApple(appId, env, user, payload, callback) {
  var token = user.deviceToken;
  payload._user = user;
  ApplePushNotificationService.send(appId+"-"+env, token, payload, function (err, sentPayload) {
    if (err) {
      console.log("#_actualSend error: " + err);
      callback(err, null);
    } else {
      console.log("#_actualSend sent!");
      user.deviceBadgeNumber
      callback(null, sentPayload);
    }
  });
}

function _actualSendAndroid(appId, user, payload, callback) {

}

module.exports = PushController;
