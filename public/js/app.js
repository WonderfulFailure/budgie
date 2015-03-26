'use strict';

var app = angular.module('budgie', [
  'ngRoute',
  'ngAnimate'
])

.config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $routeProvider
        .when('/buckets', {
            templateUrl: '/buckets',
            controller: 'BucketsController'
        })
        .when('/daily', {
            templateUrl: '/daily',
            controller: 'DailyController'
        })
        .when('/spend', {
            templateUrl: '/spend',
            controller: 'SpendController'
        })
        .when('/settings', {
            templateUrl: '/settings',
            controller: 'SettingsController'
        })
        .when('/premium', {
            templateUrl: '/premium',
            controller: 'PremiumController'
        })
        .when('/login', {
            templateUrl: '/login',
            controller: 'LoginController'
        })
        .when('/signup', {
            templateUrl: '/signup',
            controller: 'SignUpController'
        })
        .when('/welcome', {
            templateUrl: '/welcome'
        })
        .otherwise({redirectTo: '/daily'});
}])

.controller('LoginController', function($scope, $routeParams, $http, $location) {
    $scope.processLogin = function() {
        if($scope.login.$valid) {
            $http({
              method  : 'POST',
              url     : '/login',
              data    : 'username=' + $scope.username + "&password=" + $scope.password,  // pass in data as strings
              headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
          })
            .success(function(response, status) {
                if(response.code == 0 && status == 200) {
                    $location.path('/daily');
                }
                else {
                    $scope.error = response.message;
                }
            });
            window.Intercom('boot', {
              app_id: "ay3p9jeb",
              // TODO: The current logged in user's full name
              name: $scope.username,
              // TODO: The current logged in user's email address.
              email: "john.tooaaao@example.com",
              // TODO: The current logged in user's sign-up date as a Unix timestamp.
              created_at: Date.now
            });
        }
    }
})

.controller('SignUpController', function($scope, $routeParams, $http, $location) {

    $scope.processSignup = function() {
        if($scope.signup.$valid) {
            $http({
              method  : 'POST',
              url     : '/signup',
              data    : 'username=' + $scope.username + "&password=" + $scope.password,  // pass in data as strings
              headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
            })
          .success(function(response, status) {
            if(response.code == 0 && status == 200) {
                $location.path('/daily');
            }
            else {
                $scope.submitError = response.message;
            }
          });
        }
    }

})

.controller('SettingsController', function($scope, $routeParams, $http, $location) {
    $scope.pageClass = 'page-settings';
    $scope.error = '';

    $http({
          method  : 'GET',
          url     : '/2/settings',
        })
      .success(function(response, status) {
        if(!response.error && status == 200) {
            $scope.monthlyBudget = parseFloat(response.monthlyBudget / 100).toFixed(2);
            $scope.bucketName = response.bucketName;
            $scope.bucketGoal = parseFloat(response.bucketGoal / 100).toFixed(2);
        }
      });

    $scope.submitSettings = function() {
        if($scope.settings.$valid) {
            var monthlyBudgetInCents = $scope.monthlyBudget * 100;
            var bucketGoalInCents = $scope.bucketGoal * 100;

            $http({
              method  : 'POST',
              url     : '/2/settings',
              data    : 'monthlyBudget=' + monthlyBudgetInCents + "&bucketName=" + $scope.bucketName + "&bucketGoal=" + bucketGoalInCents,  // pass in data as strings
              headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
            })
          .success(function(response, status) {
            if(!response.error && status == 200) {
                $location.path('/daily');
            }
          });
      }
    }
})

.controller('DailyController', function($scope, $routeParams, $route, $http, $location) {
    $scope.todaysDate = new Date();
    $scope.pageClass = 'page-daily';

    $http({
        method  : 'GET',
        url     : '/2/transactions'
    })
    .success(function(data) {
        if(!data.error) {
            $scope.transactions = data;
            $scope.getTotal = function(){
                var total = 0;
                for(var i = 0; i < $scope.transactions.length; i++){
                    total += $scope.transactions[i].amount / 100;
                }
                return total;
            }
        }
        else {
            $location.path('/login');
        }
    })
    .then(function() {
        return $http({
            method  : 'GET',
            url     : '/2/balance'
        })
        .success(function(data) {
            if(!data.error) {
                $scope.user = data;
                var rp1 = radialProgress(document.getElementById('div1'))
                        .diameter(300)
                        .value(data.today)
                        .maxValue(data.daily)
                        .render();
            }
            else {
                $location.path('/login');
            }
        });
    });
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
          url     : '/2/transactions',
          data    : 'amount=' + $scope.amount,  // pass in data as strings
          headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
      .success(function(response, status) {
        if(!response.error && status == 200) {
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
        url     : '/2/balance'
    })
    .success(function(data) {
        dailyBudget = data.daily;
        remainingBudget = data.today;
        newBudget = remainingBudget;

        $scope.remainingBudget = remainingBudget;
    })
    .then(function() {
        return $http({
            method  : 'GET',
            url     : '/2/buckets'
        })
        .success(function(data) {
            if(!data.error) {
                contributedToBucket = data.progress;
                newContribution = contributedToBucket;
                bucketGoal = data.goal;

                $scope.contributedToBucket = contributedToBucket;
                $scope.bucketName = data.title;

                var rp1 = radialProgressSmall(document.getElementById('div3'))
                        .diameter(150)
                        .value(contributedToBucket)
                        .maxValue(bucketGoal)
                        .render();
                var rp2 = radialProgressSmall(document.getElementById('div2'))
                        .diameter(150)
                        .value(remainingBudget)
                        .maxValue(dailyBudget)
                        .innerLabel(remainingBudget)
                        .render();
            }
            else {
                $location.path('/login');
            }
        });
    });

    $scope.updateSlider = function(event) {
        var rp1 = radialProgressSmall(document.getElementById('div3'))
            .diameter(150)
            .currentArc(parseFloat(newContribution / bucketGoal) * (2*Math.PI))
            .value(parseInt($scope.amount) + parseInt(contributedToBucket))
            .maxValue(parseInt(bucketGoal))
            .render();
        newContribution = parseInt($scope.amount) + parseInt(contributedToBucket);
        var rp2 = radialProgressSmall(document.getElementById('div2'))
            .diameter(150)
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
          url     : '/2/buckets',
          data    : 'amount=' + $scope.amount / 100,  // pass in data as strings
          headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
      .success(function(response, status) {
        if(status == 200) {
            $location.path('/daily');
        }
      });
    }
})

.controller('PremiumController', function($scope, $routeParams) {
    $scope.pageClass = 'page-premium';
});