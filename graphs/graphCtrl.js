var graphModule = angular.module('project_X.graphs', [
        'ui.router',
        // 'nvd3'
    ])

    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('graphs', {
            url: '/graphs',
            templateUrl: 'graphs/graphs.html',
            controller: 'graphController as graphCtrl',
        });
    }])

    .controller('graphController', ['$scope', '$http', 'graphService', '$interval', 'masterService', function($scope, $http, graphService, $interval, masterService) {

        var graphCtrl = this;
        $scope.$broadcast('stopPredictionInterval', true);
        graphCtrl.getProducts = function() {
            masterService.getProductList().then(function(res) {
                graphCtrl.products = Object.keys(res.data.data.model_meta_data.class_data);
            }, function(err) {
                console.log("Error " + err);
            });
        }
        graphCtrl.getProducts();

        graphCtrl.options = {
            chart: {
                type: 'lineChart',
                height: 350,
                margin: {
                    top: 20,
                    right: 100,
                    bottom: 40,
                    left: 100
                },
                x: function(d) { return (d.x); },
                y: function(d) { return (d.y) / 100; },

                // color: d3.scale.category10().range(),
                duration: 300,
                clipVoronoi: false,
                useInteractiveGuideline: true,
                dispatch: {
                    stateChange: function(e) { console.log("stateChange"); },
                    changeState: function(e) { console.log("changeState"); },
                    tooltipShow: function(e) { console.log("tooltipShow"); },
                    tooltipHide: function(e) { console.log("tooltipHide"); }
                },
                xAxis: {
                    axisLabel: "Time",
                    tickFormat: function(d) {
                        return;
                    },
                    showMaxMin: true,
                    staggerLabels: true,
                    axisLabelDistance: 1
                },
                yAxis: {

                    axisLabel: '',
                    tickFormat: function(d) {
                        // return d3.format('.02f')(d);
                        return;
                    },
                    axisLabelDistance: 10
                },
                callback: function(chart) {
                    console.log("!!! lineChart callback !!!");
                }
            },
            title: {
                enable: false,
                text: 'Title for Line Chartt'
            },
            subtitle: {
                enable: false,
                text: 'Subtitle for Line Chart',
                css: {
                    'text-align': 'center',
                    'margin': '10px 13px 0px 7px'
                }
            },
            caption: {
                enable: false,
                html: '<b>Footer here',
                css: {
                    'text-align': 'justify',
                    'margin': '10px 13px 0px 7px'
                }
            }
        };

        /**
         * Fetch the plot data based on the product and the class-name
         * @return {array} data to be ploted will be in array format
         */
        graphCtrl.fetchPlotData = function() {
            if (graphCtrl.selectedProductInGraph == undefined) {
                return false;
            }
            if (graphCtrl.api != undefined) {
                scope = graphCtrl.api.getScope();
                scope.options.chart.yAxis.axisLabel = "Volume Of " + graphCtrl.selectedProductInGraph;
            };
            graphService.getPlotData(graphCtrl.selectedProductInGraph).then(function(res) {
                getData(res.data.data.model_metadata);
            }, function(error) {
                console.log("err", error);
            });
        }
        var graphInterval = $interval(function() {
            graphCtrl.fetchPlotData();
        }, 10000);

        graphCtrl.callback = function(scope) {
            scope.options.chart.yAxis.axisLabel = "Volume Of " + graphCtrl.selectedProductInGraph;
            graphCtrl.api = scope.api;
            // scope.api.refresh();
        };

        function getData(graphData) {
            graphCtrl.data = {};
            angular.forEach(graphData[graphCtrl.selectedProductInGraph], function(value, keyAttribute) {
                switch (keyAttribute) {
                    case 'age':
                        keyAttribute = "Age"
                        break;
                    case 'city':
                        keyAttribute = "City"
                        break;
                    case 'gender':
                        keyAttribute = "Gender"
                        break;
                    case 'mIncome':
                        keyAttribute = "Monthly Income"
                        break;
                    case 'occupation':
                        keyAttribute = "Occupation"
                        break;
                }
                graphCtrl.data[keyAttribute] = [];
                angular.forEach(value, function(item, key) {
                    graphCtrl.data[keyAttribute].push({
                        values: item, //values - represents the array of {x,y} data points
                        key: key, //key  - the name of the series.
                    })
                });
            });

            return graphCtrl.data;

        };

    }])