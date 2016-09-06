'use strict';

var config = require('meanio').loadConfig(),
    socketio = require('socket.io');


module.exports = function(http) {

    var io = socketio.listen(http);
    return io;
};
