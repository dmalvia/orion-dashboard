'use strict';

var predictionModule = angular.module('project_X.prediction', [
        'ui.router',
        'nvd3',
        'angularFileUpload',
        'nvd3ChartDirectives',
        'ui.bootstrap'
    ])

    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('prediction', {
            url: '/prediction',
            templateUrl: 'prediction/prediction.html',
            controller: 'predictionController as predictionCtrl',
        });
    }])

    .controller('predictionController', ['$scope', '$http', 'masterService', 'FileUploader', '$interval', function($scope, $http, masterService, FileUploader, $interval) {
        var predictionCtrl = this;
        $scope.$broadcast('stopGraphInterval', true);
        predictionCtrl.labels = [];
        predictionCtrl.selected = {};
        predictionCtrl.imageSrc = '';

        predictionCtrl.getProducts = function() {
            masterService.getProductList().then(function(res) {
                var products = Object.keys(res.data.data.model_meta_data.class_data);
                var productsAttrs = res.data.data.model_meta_data.class_data[products[0]].attribute_metadata
                // predictionCtrl.labels = Object.keys(productsAttrs);
                predictionCtrl.productsAttrsValues = Object.values(productsAttrs);
                predictionCtrl.productsAttrsValues.sort(function(x, y) {
                    return y.is_mandatory - x.is_mandatory;
                });
            }, function(err) {
                console.log("Error " + err);
            });
        }

        predictionCtrl.getProducts();

        predictionCtrl.findMatchingUsers = function(user) {
            predictionCtrl.loading = true;
            return masterService.findUsers(user).then(function(res) {
                predictionCtrl.loading = false;
                var users = [];
                angular.forEach(res.data.data.twitter_users, function(user) {
                    users.push({ "name": user.name, "id": user.id, "username": user.network_link, "imgSrc": user.image_url })
                })

                return users.slice(0, 10);
            }, function(err) {
                predictionCtrl.loading = false;
                console.log("Error in finding users ->" + err);
            });
        }



        predictionCtrl.predictOnSelect = function(userid, imgSrc) {
            predictionCtrl.imageSrc = imgSrc;
            masterService.getPredictionOnSelect(userid).then(function(res) {
                console.log('Predict on Select of User:-> ', res.data);
                angular.forEach(predictionCtrl.productsAttrsValues, function(attribute) {
                    predictionCtrl.selected[attribute.attribute_name] = res.data.data[attribute.attribute_name];
                });
            }, function(err) {
                console.log("Error in prediction ->" + err);
            });
        }

        predictionCtrl.detectEmpty = function() {
            if (predictionCtrl.selectedUser.trim().length === 0) {
                // predictionCtrl.selected = {};
                predictionCtrl.imageSrc = '';
            }
        }
        /**
         * Call to predict what product should be pitched
         * @return {array of objects}     set the prediction and distribution from the result data
         */
        predictionCtrl.getPrediction = function() {
            var dataObj = {};
            var mandateFlag = false;
            angular.forEach(predictionCtrl.productsAttrsValues, function(attribute) {
                if (attribute.is_mandatory && (predictionCtrl.selected[attribute.attribute_name] == null || predictionCtrl.selected[attribute.attribute_name] == undefined)) {
                    mandateFlag = true;
                }
                dataObj[attribute.attribute_name] = predictionCtrl.selected[attribute.attribute_name];
            });

            dataObj["Name"] = predictionCtrl.selectedUser;  
            var data = {
                "data": [
                    dataObj
                ]
            }
            if (mandateFlag) {
                alert("Please fill out all the mandatory fields!!")
            } else {
                masterService.getPrediction(data).then(function(res) {
                    if (res.data != undefined) {
                        predictionCtrl.data = [];
                        angular.forEach(res.data.data[0].historic_distributions, function(value, key) {
                            predictionCtrl.data.push({ "key": key, "values": value });
                        })

                        predictionCtrl.prediction = res.data.data[0].current.prediction;
                        predictionCtrl.regression = res.data.data[0].current.regression;
                        predictionCtrl.creditScore = res.data.data[0].current.creditScore;
                        predictionCtrl.distribution = [];
                        predictionCtrl.existing = res.data.data[0].existing;
                        angular.forEach(res.data.data[0].current.distribution.split(","), function(value) {
                            predictionCtrl.distribution.push(value.split(":").shift());
                        });
                        
                        
                        if (predictionCtrl.regression == undefined) {
                            document.getElementById('regression').style.display = 'none';
                        }
                        else {
                            document.getElementById('regression').style.display = 'inline';
                        }

                        if (predictionCtrl.creditScore == undefined) {
                            document.getElementById('creditScore').style.display = 'none';
                        }
                        else{
                            document.getElementById('creditScore').style.display = 'inline';
                        }

                        if (predictionCtrl.distribution == undefined) {
                            document.getElementById('distribution').style.display = 'none';
                        }
                        else {
                            document.getElementById('distribution').style.display = 'inline';
                        }

                        if (predictionCtrl.existing == undefined) {
                            document.getElementById('existing').style.display = 'none';
                        }
                        else {
                            document.getElementById('existing').style.display = 'inline';
                        }
                        
                        
                    } else {
                        predictionCtrl.prediction = "Unable to predict, please try again";
                    }

                }, function(error) {
                    console.log("err", error);
                    predictionCtrl.prediction = "Unable to predict, please try again";
                    predictionCtrl.data = [];
                    predictionCtrl.distribution = [];
                });
            }
            
            
        }

        /*Upload*/

        predictionCtrl.uploader = $scope.uploader = new FileUploader({
            url: masterService.apiURIs.uploadUrl,
            removeAfterUpload: true
        });

        predictionCtrl.uploader.filters.push({
            name: 'customFilter',
            fn: function(item /*{File|FileLikeObject}*/ , options) {
                return this.queue.length < 10;
            }
        });

        predictionCtrl.uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        predictionCtrl.uploader.onSuccessItem = function(fileItem, response, status, headers) {
            document.getElementById('fileUpload').value = null;
            alert("Training has been completed successfully!")
        };
        predictionCtrl.uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
            alert("Couldn't complete training, please try again!")
        };

        //Bar graph functions
        predictionCtrl.xAxisTickFormatFunction = function() {
            return function(d) {
                return d3.time.format('%b')(new Date(d));
            };
        };

        var colorCategory = d3.scale.category20b();
        predictionCtrl.colorFunction = function() {
            var colorsByDepartment = ['red', 'orange'];

            return function(d, i) {
                return colorsByDepartment[i];
            };
        }

        predictionCtrl.toolTipContentFunction = function() {
            return function(key, x, y, e, graph) {
                console.log('tooltip content');
                return 'Super New Tooltip' +
                    '<h1>' + key + '</h1>' +
                    '<p>' + y + ' at ' + x + '</p>'
            }
        };



    }])