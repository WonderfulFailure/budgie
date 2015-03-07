'use strict';

var app = angular.module('budgie', [
  'ngRoute',
  'ngAnimate'
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
            controller: 'BucketsController'
        })
        .when('/daily', {
            templateUrl: '/daily',
            controller: 'DailyController'

        })
        .when('/goal', {
            templateUrl: '/goal',
            controller: 'GoalController'

        })
        .when('/spend', {
            templateUrl: '/spend',
            controller: 'SpendController'

        })
        .when('/save', {
            templateUrl: '/save',
            controller: 'SaveController'

        })
        .when('/settings', {
            templateUrl: '/settings',
            controller: 'SettingsController'
        })
        .otherwise({redirectTo: '/'});
}])

.controller('BudgetController', function($scope, $routeParams) {
    $scope.amountCents = "";
    $scope.pageClass = 'page-budget';
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
    $scope.pageClass = 'page-settings';
})

.controller('GoalController', function($scope, $routeParams) {
    $scope.pageClass = 'page-goal';
})

.controller('DailyController', function($scope, $routeParams) {
    $scope.pageClass = 'page-daily';
})

.controller('SaveController', function($scope, $routeParams) {
    $scope.pageClass = 'page-save';
})

.controller('SpendController', function($scope, $routeParams) {
    $scope.pageClass = 'page-spend';
})

.controller('BucketsController', function($scope, $routeParams) {
    $scope.pageClass = 'page-buckets';
});



