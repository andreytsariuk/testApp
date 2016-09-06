'use strict';

var mean = require('meanio'),
    cron = require('../controllers/cron.js'),
    // globalEE = require('global-eventemitter'),
    index = require('../controllers/index.js');
module.exports = function (MeanStarter, app, io, auth, database) {

    cron.check(io); // Starting Cron for checking tasks 

    //----------------------------- Start Socket.io mechanism ---------------------
    io.on('connection', function (socket) {
        var temp = {
            socket: socket.id
        };
        console.log('--> One more user connected to notifications');

        // Setting up the socket
        setTimeout(function () {
            index.getTasks(io);
            socket.emit('connected');
        }, 500);

        socket.on('saveTask', function (task) {
            
            index.saveTaskInMem(io, task, function (err) {
                if (err) {
                    console.log('Error : socket on save', err);
                }
            });
        });

        socket.on('removeTask', function (task) {
            index.removeTaskInMem(io, task, function (err) {
                if (err) {
                    console.log('Error : socket on save', err);
                }
            });
        });

        socket.on('disconnect', function () {
            console.log('<-- Notifications - user disconnected', temp.user, temp.socket);

        });

    });
    //-----------------------------END Socket.io mechanism ---------------------

}