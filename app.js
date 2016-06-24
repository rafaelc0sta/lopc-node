// Setup Websocket


// Setup Webserver:

var https = require('https');
var fs = require('fs');
var express = require('express');
global.app = express();

// Enable API usage by any website
global.app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var bodyParser = require('body-parser');

global.app.use(bodyParser.json());

global.config = require('konfig')();

require('./lib/mongo')();

var ObjectId = require('mongodb').ObjectId;

var Router = require('./router');
var ApplePushNotificationService = require('./lib/apns.js');

global.router = new Router(global.app);

var startServer = function () {

  var serverOptions = {
     key  : fs.readFileSync(global.config.ssl.certificateKeyPath),
     cert : fs.readFileSync(global.config.ssl.certificatePath)
  };

  global.server = https.createServer(serverOptions, global.app).listen(3000, function () {
     console.log('Started listening on port 3000');
  });
}

setInterval(function () {
  console.log("Restarting webserver (to reload certificates)");
  global.server.close();
  startServer();
}, global.config.ssl.reloadInterval);

startServer();

// Routes:

var User = require('./model/user');
var AdminUser = require('./model/adminUser');
var App = require('./model/app');

var UserController = require('./controllers/userController');
var PushController = require('./controllers/pushController');
var AppController = require('./controllers/appController');

var git = require('./git');

global.router.addRoute('GET', '/apps', AppController.allApps);

global.router.addRoute('POST', '/push', PushController.send);

global.router.addRoute('POST', '/device', UserController.create);
global.router.addRoute('GET', '/device', UserController.index);
global.router.addRoute('POST', '/device/query', UserController.search);
global.router.addRoute('GET', '/device/:id', UserController.show);

global.router.addRoute('GET','/info', function (req, res) {
  git.getLastTag(function (err, tag) {
    if (err && !tag) tag = 'UNKNOWN';
    res.json({
      projectName : 'Low Orbit Push Cannon',
      projectVersion: tag
    });
  });
});
