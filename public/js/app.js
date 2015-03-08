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
        .otherwise({redirectTo: '/daily'});
}])

.controller('BudgetController', function($scope, $routeParams) {
    $scope.pageClass = 'page-budget';
})

.controller('SettingsController', function($scope, $routeParams) {
    $scope.pageClass = 'page-settings';
})

.controller('GoalController', function($scope, $routeParams) {
    $scope.pageClass = 'page-goal';
})

.controller('DailyController', function($scope, $routeParams, $route, $http) {
    $scope.todaysDate = new Date();
    $scope.pageClass = 'page-daily';

    $http({
        method  : 'GET',
        url     : '/transactions'
    })
    .success(function(data) {
        $scope.transactions = data;
        $scope.getTotal = function(){
            var total = 0;
            for(var i = 0; i < $scope.transactions.length; i++){
                total += $scope.transactions[i].amount / 100;
            }
            return total;
        }
    });

    $http({
        method  : 'GET',
        url     : '/user'
    })
    .success(function(data) {
        $scope.user = data;
        var rp1 = radialProgress(document.getElementById('div1'))
                .diameter(300)
                .value(data.todaysBudget)
                .maxValue(data.dailyBudget)
                .render();
    });
})

.controller('SaveController', function($scope, $routeParams) {
    $scope.pageClass = 'page-save';
})

.controller('SpendController', function($scope, $routeParams, $http, $location, $route, $timeout) {
    $scope.pageClass = 'page-spend';

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

    $scope.processForm = function() {
        $http({
          method  : 'POST',
          url     : '/spend-save',
          data    : 'amount=' + $scope.amount,  // pass in data as strings
          headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
      .success(function(data) {
        if (data != 0) {
          // if not successful, bind errors to error variables
          console.log('something went wrong');
        } else {
          // if successful, bind success message to message
          $location.path('/daily');
        }
      });
    }
})

.controller('BucketsController', function($scope, $routeParams, $http, $location) {
    $scope.pageClass = 'page-buckets';
    $scope.amount = "00.00";

    var contributedToBucket;
    var newContribution = 0;
    var bucketGoal;

    var dailyBudget;
    var remainingBudget;
    var newBudget = 0;

    $http({
        method  : 'GET',
        url     : '/user'
    })
    .success(function(data) {
        dailyBudget = data.dailyBudget;
        remainingBudget = data.todaysBudget;
        newBudget = remainingBudget;

        $scope.remainingBudget = remainingBudget;
    })
    .then(function() {
        return $http({
            method  : 'GET',
            url     : '/bucket-list'
        })
        .success(function(data) {
            contributedToBucket = data.progress;
            newContribution = contributedToBucket;
            bucketGoal = data.goal;

            $scope.contributedToBucket = contributedToBucket;

            var rp1 = radialProgress(document.getElementById('div3'))
                    .diameter(300)
                    .value(contributedToBucket)
                    .maxValue(bucketGoal)
                    .innerLabel(contributedToBucket)
                    .render();
            var rp2 = radialProgress(document.getElementById('div2'))
                    .diameter(300)
                    .value(remainingBudget)
                    .maxValue(dailyBudget)
                    .innerLabel(remainingBudget)
                    .render();
        });
    });

    $scope.updateSlider = function(event) {
        var rp1 = radialProgress(document.getElementById('div3'))
            .diameter(300)
            .currentArc(parseFloat(newContribution / bucketGoal) * (2*Math.PI))
            .value(parseInt($scope.amount) + parseInt(contributedToBucket))
            .maxValue(parseInt(bucketGoal))
            .render();
        newContribution = parseInt($scope.amount) + parseInt(contributedToBucket);
        var rp2 = radialProgress(document.getElementById('div2'))
            .diameter(300)
            .currentArc(parseFloat(newBudget / dailyBudget) * (2*Math.PI))
            .currentArc2(0)
            .value(remainingBudget - parseInt($scope.amount))
            .maxValue(dailyBudget)
            .innerLabel(remainingBudget)
            .render();
        newBudget = remainingBudget - parseInt($scope.amount);
    }

    $scope.processForm = function() {
        $http({
          method  : 'POST',
          url     : '/bucket-save',
          data    : 'amount=' + $scope.amount,  // pass in data as strings
          headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
      .success(function(data) {
        if (data != 0) {
          // if not successful, bind errors to error variables
          console.log('something went wrong');
        } else {
          // if successful, bind success message to message
          $location.path('/daily');
        }
      });
    }
});


