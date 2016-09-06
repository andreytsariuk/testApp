'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var MeanStarter = new Module('meanStarter');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
MeanStarter.register(function (app, users, system, auth, database,http) {
  var io = require('./server/config/index')(http);
  MeanStarter.io = io;

  MeanStarter.routes(app, io, auth, database);
  // Set views path, template engine and default layout
  app.set('views', __dirname + '/server/views');

  MeanStarter.angularDependencies(['mean.system', 'mean.users']);

  return MeanStarter;
});
