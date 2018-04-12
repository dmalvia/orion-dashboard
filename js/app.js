'use strict';

// Declare app level module which depends on views, and components
var project_X = angular.module('project_X', [
    'ui.router',
    'project_X.prediction',
    'project_X.graphs',
    'project_X.training'
]).
config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/training');
    }])


    .controller('rootController', ['$scope', '$http', '$location', function($scope, $http, $location) {
        var rootCtrl = this;
        rootCtrl.active = ($location.path().split("/")[1] == undefined) ? "training" : $location.path().split("/")[1];
        rootCtrl.setActive = function(item) {
            rootCtrl.active = item;
        }
    }]);