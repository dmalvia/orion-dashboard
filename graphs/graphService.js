graphModule.service('graphService', ['$http', 'masterService', function($http, masterService) {

    var graph_service = this;

      /**
       * API to get plot data based on the product and attribute
       * @param  {string} product   [description]
       * @param  {string} atrribute [description]
       * @return {object}           [description]
       */
    graph_service.getPlotData = function(product) {
        return $http({
            method: 'GET',
            url:masterService.apiURIs.plotUrl+product,
            headers: {
                'Content-Type': 'application/json'
            },
        });

    };


}]);