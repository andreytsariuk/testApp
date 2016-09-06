/* jshint ignore:start */
'use strict';

var CronJob = require('cron').CronJob,
    Memcached = require('memcached'),
    config = require('config'),
    memcached = new Memcached('localhost:' + config.memcache.port);

const lifetime = 86400; //24hrs


/** This is function for creating Multiply Table 
 * @param number is a variable max counter of multiply
 */
function returnMultiplyTable(number) {
    var outArray = [];
    for (let i = 0; i <= number; i++) {
        outArray.push(i + ' * ' + number + ' = ' + number * i);
    }
    return outArray;
}


/** This is function for saving checked tasks array
 * @param tasks are array of tasks
 * @param callback is a function for catching result 
 */
function saveTasks(tasks, callback) {
    memcached.set('tasks', tasks, lifetime, function (err) {
        if (err) {
            console.log('Error : cron : saveTasks : ', err);
            return callback(err);
        } else {
            return callback();
        }
    });
}

/** This is function for get tascs from memcache
 * @param io this is socket.io
 * 
 */
function getTasks(io) {
    memcached.get('tasks', function (err, tasks) {
        if (err) {
            console.log('Error : memcached : ', err);
            io.emit('error', err);
        } else {
            if (!tasks) {
                tasks = [];
                io.emit('getTasks', tasks);
            } else {
                io.emit('getTasks', tasks);
            }
        }
    });
}

/**This is function for emit a complete task
 * @param task current task
 * @param io this is socket.io
 */
function completeTask(task,io) {
    io.emit('taskComplete', {
        task: task,
        multiplyTable: returnMultiplyTable(task.number)
    });

}

/**This is main CROn function for checking time in tasks
 * @param io is a socket.io
 */
function check(io) {
    new CronJob('00 * * * * *', function (callback) {
        memcached.get('tasks', function (err, tasks) {
            if (err) {
                console.log('Error : memcached Cron: ', err);
                return callback(err);
            } else {
                var nowDate = new Date();
                if (tasks) {
                    for (var i = 0; i < tasks.length; i = i + 1) {
                        let loopDate = new Date(tasks[i].date);
                        if (loopDate.getFullYear() === nowDate.getFullYear() && loopDate.getMonth() === nowDate.getMonth() && loopDate.getDate() === nowDate.getDate() && loopDate.getHours() === nowDate.getHours() && loopDate.getMinutes() === nowDate.getMinutes()) {
                            tasks[i].completed = true;
                            completeTask(tasks[i],io);
                        }
                    }
                    saveTasks(tasks, function (err) {
                        if (err) {
                            console.log('Error : memcached Cron: ', err);
                            return callback(err);
                        } else {
                            getTasks(io);
                            return callback();
                        }
                    })

                } else {
                    return callback();
                }
            }
        });
    }, function () {
        console.log('stop Cron');
    }, true, 'Europe/Kiev');

}


exports.check = check;

/* jshint ignore:end */