'use strict';

var socketio = require('socket.io');


module.exports = function(http) {

    var io = socketio.listen(http);
    return io;
};
