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
    $scope.amountCents = "";
    $scope.updateDollars = function(event) {
        var num = event.which || event.keyCode;
        if(num > 47 && num < 58) {
            $scope.amountCents = $scope.amountCents.concat(String.fromCharCode(num));
        }
        else if(num == 8) {
            $scope.amountCents = $scope.amountCents.substring(0, $scope.amountCents.length - 1);
        }

        var amount = parseFloat($scope.amountCents / 100).toFixed(2);
        if(String(amount).length <= 4)
            amount = 0 + String(amount);
        $scope.amount = amount;
    }
})

.controller('SettingsController', function($scope, $routeParams) {
    $scope.clickme = function(event) {
        event.preventDefault();
        console.log('You clicked me');
    }
})

