'use strict';

angular
  .module('mean.system')
  .config(['growlProvider', function (growlProvider) {
    growlProvider.globalTimeToLive({ success: 2000, error: 4000, warning: 2000, info: 2000 });
  }])
  .controller('IndexController', ['$scope', '$rootScope', '$http', '$filter', '$log', 'Socket', 'growl', 'NgTableParams', 'Global',
    function ($scope, $rootScope, $http, $filter, $log, Socket, growl, NgTableParams, Global) {
      $scope.global = Global;

      //----------------------------------------important Variables------------ 
      $scope.number = 1;
      $scope.tasks = [];
      $scope.completedTasks = [];

      $scope.numbers = {
        mstep: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      };

      //----------------------------------------important Variables------------

      //---------------------------------------START Classes-------------------------
      /**
       * This class for complete task
       */
      class CompleteTask {
        constructor(multiplyTable, number) {
          this.multiplyTable = multiplyTable;
          this.number = number;
          this.tasksIds = [];
        }

        addTaskId(tasksId) {
          var exists = false;
          for (let i = 0; i < this.tasksIds.length; i++) {
            if (this.tasksIds[i] === tasksId) {
              exists = true;
            }
          }
          if (!exists)
            this.tasksIds.push(tasksId);
        }
        static removeTask(task) {
          for (let i = 0; i < $scope.completedTasks.length; i++) {
            let flag = false;
            for (let j = 0; j < $scope.completedTasks[i].tasksIds.length; j++) {
              if ($scope.completedTasks[i].tasksIds[j] === task.id) {
                if ($scope.completedTasks[i].tasksIds.length - 1 === 0) {
                  $scope.completedTasks.splice(i, 1);
                  flag = true;
                  break;
                } else {
                  $scope.completedTasks[i].tasksIds.splice(j, 1);
                  flag = true;
                  break;
                }
              }
            }
            if (flag) break;
          }
        }


        /** This is function for creating Multiply Table 
        * @param number is a variable max counter of multiply
        */
        static returnMultiplyTable(number) {
          var outArray = [];
          for (let i = 0; i <= number; i++) {
            outArray.push(i + ' * ' + number + ' = ' + number * i);
          }
          return outArray;
        }


        /** This is function for checking of exists complete tasks by number
         * @param number is a number of multiply Table
         */
        static checkExistsOfMultiplyTable(number) {
          var out = false;
          for (let i = 0; i < $scope.completedTasks.length; i++) {
            if ($scope.completedTasks[i].number === number) {
              out = i;
              break;
            }
          }
          console.log('out', out);
          return out;
        }
      }





      /**
       * This class for all class
       */
      class Task {
        /**
        * This function for saving new task from user form
        */
        static save() {
          Socket.emit('saveTask', {
            date: $scope.mytime,
            number: $scope.number,
            completed: false
          });
        }

        /**This function for remover task 
        * @param task is a current task
        */
        static remove(task) {
          CompleteTask.removeTask(task);
          Socket.emit('removeTask', task);
        }
      }
      //--------------------------------------- END Classes-------------------------





      /** This is function for Create array of completed Tasks
       * @param tasks is array of all tasks
       */
      function createCompletedTasks(tasks) {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].completed) {
            let indexOfCompleteTask = CompleteTask.checkExistsOfMultiplyTable(tasks[i].number);
            if (indexOfCompleteTask || indexOfCompleteTask === 0) {
              $scope.completedTasks[indexOfCompleteTask].addTaskId(tasks[i].id);
            } else {
              let newCompleteTask = new CompleteTask(CompleteTask.returnMultiplyTable(tasks[i].number), tasks[i].number);
              newCompleteTask.addTaskId(tasks[i].id);
              $scope.completedTasks.push(newCompleteTask);
            }
          }
        }
        console.log($scope.completedTasks);
      }


      $scope.remove = Task.remove;
      $scope.save = Task.save;


      //-----------------------------------------time picker----------------------------------------



      $scope.mytime = new Date();

      $scope.hstep = 1;
      $scope.mstep = 1;


      $scope.ismeridian = true;
      $scope.toggleMode = function () {
        $scope.ismeridian = !$scope.ismeridian;
      };

      $scope.update = function () {
        var d = $scope.dt;
        d.setHours(14);
        d.setMinutes(0);
        $scope.mytime = d;
      };

      $scope.changed = function () {
        $log.log('Time changed to: ' + $scope.mytime);
      };

      $scope.clear = function () {
        $scope.mytime = null;
      };


      //---------------------------------------time picker --------------------------------------------

      $scope.today = function () {
        $scope.dt = new Date();
      };
      $scope.today();

      $scope.clear = function () {
        $scope.dt = null;
      };

      $rootScope.$watch(function () {
        return $scope.dt;
      }, function () {
        $scope.mytime = $scope.dt;
      });

      $scope.dateOptions = {

        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
      };


      $scope.open1 = function () {
        $scope.popup1.opened = true;
      };

      $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
      $scope.format = $scope.formats[0];
      $scope.altInputFormats = ['M!/d!/yyyy'];

      $scope.popup1 = {
        opened: false
      };

      //------------------------------------NgTable Options-----------------------
      $scope.vm = {};
      $scope.vm.tableParams = new NgTableParams(
        {
          page: 1,
          count: 6,
          sorting: {
            date: 'desc',
          },
          filterDelay: 300
        },
        {
          counts: [3, 6, 9],
          getData: function (params) {
            params.total($scope.tasks.length);
            createCompletedTasks($scope.tasks);
            var filteredData = params.filter() ? $filter('filter')($scope.tasks, params.filter()) : $scope.tasks;
            var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
            var page = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
            return page;
          }
        });



      //------------------------------------NgTable Options-----------------------



      //----------------------------------- START Socket.IO Events-------------------------
      Socket.on('connected', function () {
        console.debug('Connected to the Socket.IO');
        growl.success('Connected to the Socket.IO', { title: 'Success!' });
      });

      Socket.on('getTasks', function (tasks) {
        console.debug('getTasks', tasks);
        $scope.tasks = tasks;
        $scope.vm.tableParams.reload();
      });

      Socket.on('taskSaved', function (tasks) {
        growl.info('New task has been saved!', { title: 'Task' });
        $scope.tasks = tasks;
        $scope.vm.tableParams.reload();
      });

      Socket.on('taskComplete', function (data) {
        growl.success('Anothe One task has been complete! It was task with id ' + data.task.id, { title: 'Task' });
        $scope.vm.tableParams.reload();
      });

      Socket.on('taskRemoved', function (tasks) {
        growl.error('New task has been removed!', { title: 'Task' });
        $scope.tasks = tasks;
        $scope.vm.tableParams.reload();
      });

      Socket.on('error', function (err) {
        growl.error(err, { title: 'error' });
      });

      //-----------------------------------END Socket.IO Events-------------------------
    }
  ]);
