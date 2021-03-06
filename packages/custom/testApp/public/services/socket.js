/* jshint ignore:start */
'use strict';
var baseUrl = 'localhost:3000';

angular
    .module('mean.system')
    .factory('Socket', function ($rootScope) {
        var socket = io.connect(baseUrl);

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    console.log('event:', eventName);
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    });

    /* jshint ignore:end */