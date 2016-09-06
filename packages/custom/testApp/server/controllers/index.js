'use strict';

var config = require('config'),
    async = require('async'),
    Memcached = require('memcached'),
    memcached = new Memcached('localhost:' + config.memcache.port);
const lifetime = 86400; //24hrs


function getTasks(io) {
    memcached.get('tasks', function (err, tasks) {
        if (err) {
            console.log('Error : memcached : ', err);
            io.emit('io', err);
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


/** This function for serching index of task in array of tasks 
 * @param tasks is array of tasks
 * @param id is id of current task
 */
function findTaskById(tasks, id) {
    var index = 0;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
}

/**This function generate a new  uniq id for task SIMPLE STUPID METHOD
 * @param tasks is array of tasks
 */
function generateIdForTask(tasks) {
    var id=-1;
    for (var i = 0; i < tasks.length; i = i + 1) {
        let exists = false;
        for (var j = 0; j < tasks.length; j = j + 1) {
            if (tasks[j].id === i) {
                exists = true;
            }
        }
        if (!exists) {
            id = i;
            break;
        }
    }
    if (id===-1) {
        id = tasks.length;
    }
    console.log('new id',id);
    return id;
}


/**This is function for removing task from Memcached Server
 * @param io is a scoket.io
 * @param task is a current task
 * @param callback is callback function 
 */
function removeTaskInMem(io, task, callback) {

    //Checking for task exists
    if (!task) {
        io.emit('error', 'No one task have been Send!');
        return callback();
    }

    //try to get tasks from memchached
    memcached.get('tasks', function (err, tasks) {
        if (err) {
            console.log('Error : memcached : removeTaskInMem : ', err);
            return callback(err);
        } else {
            async
                .waterfall([
                    function (waterfallCallback) {
                        if (!tasks) {
                            //if dosn't exists create new key 
                            memcached.touch('tasks', lifetime, function (err) {
                                if (err) {
                                    console.log('Error : memcached : removeTaskInMem :', err);
                                    return waterfallCallback(err);
                                } else {
                                    //and create new value for key 'tasks'
                                    tasks = [];
                                    return waterfallCallback();
                                }
                            });
                        } else {

                            //if exists, delete form array task with it's id
                            tasks.splice(findTaskById(tasks, task.id), 1);
                            return waterfallCallback();
                        }
                    },
                    function (waterfallCallback) {
                        //set a new value for key 'tasks' in memcached
                        memcached.set('tasks', tasks, lifetime, function (err) {
                            if (err) {
                                console.log('Error : memcached : removeTaskInMem : ', err);
                                return waterfallCallback(err);
                            } else {
                                return waterfallCallback();
                            }
                        });
                    }
                ], function (err) {
                    //last check for errors and send result
                    if (err) {
                        io.emit('error', err);
                        return callback(err);
                    } else {
                        io.emit('taskRemoved', tasks);
                        return callback();
                    }
                });
        }
    });

}


/**This is function for saving task in Memcached Server
 * @param io is a scoket.io
 * @param task is a current task
 * @param callback is callback function 
 */
function saveTaskInMem(io, task, callback) {

    //Checking for task exists
    if (!task) {
        io.emit('error', 'No one task have been Send!');
        return callback();
    }

    //try to get tasks from memchached
    memcached.get('tasks', function (err, tasks) {
        if (err) {
            console.log('Error : memcached : saveTaskInMem : ', err);
            return callback(err);
        } else {
            async
                .waterfall([
                    function (waterfallCallback) {
                        if (!tasks) {
                            //if dosn't exists create new key 
                            memcached.touch('tasks', lifetime, function (err) {
                                if (err) {
                                    console.log('Error : memcached : saveTaskInMem : ', err);
                                    return waterfallCallback(err);
                                } else {
                                    //set new Id for task 
                                    task.id = 0
                                    //and create new value for key 'tasks'
                                    tasks = [task];
                                    return waterfallCallback();
                                }
                            });
                        } else {
                            //set new Id for task 
                            task.id = generateIdForTask(tasks);
                            //if exists push to is new task
                            tasks.push(task);
                            return waterfallCallback();
                        }
                    },
                    function (waterfallCallback) {
                        //set a new value for key 'tasks' in memcached
                        memcached.set('tasks', tasks, lifetime, function (err) {
                            if (err) {
                                console.log('Error : memcached : saveTaskInMem : ', err);
                                return waterfallCallback(err);
                            } else {
                                return waterfallCallback();
                            }
                        });

                    }
                ], function (err) {
                    //last check for errors and send result
                    if (err) {
                        io.emit('error', err);
                        return callback(err);
                    } else {
                        io.emit('taskSaved', tasks);
                        return callback();
                    }
                });
        }
    });
}

//----------------------------------Sockets Functions--------------------------------

exports.saveTaskInMem = saveTaskInMem;

exports.removeTaskInMem = removeTaskInMem;

exports.getTasks = getTasks;


//----------------------------------Sockets Functions--------------------------------



