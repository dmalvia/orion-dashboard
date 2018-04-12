project_X.service('masterService', ['$http', function($http) {

    var master_service = this;

    master_service.baseURI = 'http://ec2-13-126-130-219.ap-south-1.compute.amazonaws.com:8082/ml/v1/';

    master_service.apiURIs = {
        'prediction': master_service.baseURI + 'predict',
        'getPlot': master_service.baseURI + 'meta-data/',
        'reset': master_service.baseURI + 'reset',
        'productList': master_service.baseURI + 'model/meta-data',
        'uploadUrl': master_service.baseURI + 'train',
        'trainingUrl': master_service.baseURI + 'overview',
        'plotUrl': master_service.baseURI + 'meta-data/',
        'findUserUrl': master_service.baseURI + 'network/twitter/',
        'predictOnSelectionUrl': master_service.baseURI + 'network/twitter/analyse/'
    }

    /**
     * API to get prediction for the combination of different classs
     * @param  {Object} JSON data
     * @return {Object}            [description]
     */
    master_service.getPrediction = function(data) {
        return $http({
            method: 'POST',
            url: master_service.apiURIs.prediction,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        });
    };

    /**
     * API to get plot data based on the product and attribute
     * @param  {string} product   [description]
     * @param  {string} atrribute [description]
     * @return {object}           [description]
     */
    master_service.getPlotData = function(product, atrribute) {
        return $http({
            method: 'GET',
            url: +master_service.apiURIs.getPlot + product + '/' + atrribute,
            headers: {
                'Content-Type': 'application/json'
            },
        });

    };

    master_service.getUserData = function() {
        return $http({
            method: 'GET',
            url: 'http://ec2-13-126-226-8.ap-south-1.compute.amazonaws.com:8082/ml/v1/admin/data',
            headers: {
                'Content-Type': 'application/json'
            },
        });

    };

    master_service.resetTraining = function() {
        return $http({
            method: 'GET',
            url: master_service.apiURIs.reset,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    };

    master_service.getProductList = function() {
        return $http({
            method: 'GET',
            url: master_service.apiURIs.productList,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    };

    master_service.findUsers = function(user) {
        return $http({
            method: 'GET',
            url: master_service.apiURIs.findUserUrl + user,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    };

    master_service.getPredictionOnSelect = function(user) {
        return $http({
            method: 'GET',
            url: master_service.apiURIs.predictOnSelectionUrl + user,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    };

    function dynamicSortMultiple() {
        /*
         * save the arguments object as it will be overwritten
         * note that arguments object is an array-like object
         * consisting of the names of the properties to sort by
         */
        var props = arguments;
        return function(obj1, obj2) {
            var i = 0,
                result = 0,
                numberOfProperties = props.length;
            /* try getting a different result from 0 (equal)
             * as long as we have extra properties to compare
             */
            while (result === 0 && i < numberOfProperties) {
                result = dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result;
        }
    }

    function dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function(a, b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }



}]);
