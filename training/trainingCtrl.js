'use strict';

var trainingModule = angular.module('project_X.training', [
        'ui.router',
        'angularFileUpload'
    ])

    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('training', {
            url: '/training',
            templateUrl: 'training/training.html',
            controller: 'trainingController as trainingCtrl',
        });
    }])

    .controller('trainingController', ['$scope', "$http", 'masterService', 'FileUploader', function($scope, $http, masterService, FileUploader) {
        var trainingCtrl = this;
        var colorArry = ['#1fb469','#ea9234','#e61f1f'];
        trainingCtrl.displayTableInfo = false;
        trainingCtrl.displayUserInfo = false;
        trainingCtrl.colorFunction = function() {
            return function(d, i) {
            return colorArry[i];
            }
        }

            trainingCtrl.xFunction = function(){
                return function(d) {
                    return d.key;
                };
            }
            trainingCtrl.yFunction = function(){
                return function(d) {
                    return d.y;
                };
            }
            trainingCtrl.descriptionFunction = function(){
                return function(d){
                    return d.key;
                }
            }

            trainingCtrl.getDataFromService = function() {
                masterService.getUserData()
                    .then(function(res) {
                        trainingCtrl.data = res.data.data;
                        trainingCtrl.pending = res.data.data.pending;
                        trainingCtrl.rejected = res.data.data.rejected;
                        trainingCtrl.success = res.data.data.success;
                        trainingCtrl.total = parseInt(trainingCtrl.pending.count) + parseInt(trainingCtrl.success.count) + parseInt(trainingCtrl.rejected.count)
                        if(trainingCtrl.total == 0) {
                            trainingCtrl.example = [];
                        }
                        else {
                            trainingCtrl.example =  [
                                {
                                    'key': "Success",
                                    'y': parseInt(trainingCtrl.success.count),
                                },
                                {
                                    "key": "Pending",
                                    "y": parseInt(trainingCtrl.pending.count),
                                },
                                {
                                    "key": "Rejected",
                                    "y": parseInt(trainingCtrl.rejected.count),
                                }
                            ];
                        }
                        
                        
                    },
                    function(error) {
                        console.log(error);
                    })
            }

            trainingCtrl.showStatusTable = function(status) {
                trainingCtrl.displayTableInfo = true;
                if(status == 'success') {
                    trainingCtrl.showData = trainingCtrl.success.person_details;
                }   else if (status == 'pending'){
                    trainingCtrl.showData = trainingCtrl.pending.person_details;
                } else {
                    trainingCtrl.showData = trainingCtrl.rejected.person_details;  
                }
            }

            trainingCtrl.showUserInfo = function(user) {
                trainingCtrl.displayUserInfo = true;
                trainingCtrl.userData = user;
                console.log(trainingCtrl.userData);
            }
            
            trainingCtrl.getDataFromService();
    }]);