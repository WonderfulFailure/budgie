'use strict';

var app = angular.module('budgie', [
  'ngRoute'
])

.config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $routeProvider
        .when('/budget', {
            templateUrl: '/budget',
            controller: 'BudgetController'
        })
        .when('/buckets', {
            templateUrl: '/buckets',
        })
        .when('/daily', {
            templateUrl: '/daily',
        })
        .when('/goal', {
            templateUrl: '/goal',
        })
        .when('/settings', {
            templateUrl: '/settings',
            controller: 'SettingsController'
        })
        .otherwise({redirectTo: '/'});
}])

.controller('BudgetController', function($scope, $routeParams) {
    $scope.name = "BookController";
    $scope.params = $routeParams;
})

.controller('SettingsController', function($scope, $routeParams) {
    $scope.clickme = function(event) {
        event.preventDefault();
        console.log('You clicked me');
    }
})

