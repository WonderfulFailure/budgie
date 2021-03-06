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
            templateUrl: '/welcome',
            controller: 'WelcomeController'
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
                    $scope.loginError = response.message;
                }
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
                $location.path('/welcome');
            }
            else {
                $scope.submitError = response.message;
            }
          });
        }
    }

})

.controller('WelcomeController', function($scope, $routeParams, $http, $location) {
    $scope.processForm = function() {
        var monthlyBudgetInCents;
        if($scope.customBudgetAmount) {
            monthlyBudgetInCents = $scope.customBudgetAmount * 100;
        }
        else if($scope.spendingHabits == 'frugal') {
            monthlyBudgetInCents = 25000;
        }
        else if($scope.spendingHabits == 'moderate') {
            monthlyBudgetInCents = 40000;
        }
        else if($scope.spendingHabits == 'lavish') {
            monthlyBudgetInCents = 50000;
        }

        $http({
          method  : 'POST',
          url     : '/2/settings',
          data    : 'monthlyBudget=' + monthlyBudgetInCents + "&todaysBudget=" + monthlyBudgetInCents / 30,  // pass in data as strings
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
    }
})

.controller('SettingsController', function($scope, $routeParams, $http, $location, IntercomTrackEvent) {
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
                IntercomTrackEvent('changed-settings', {'bucket-name': $scope.bucketName});
                $location.path('/daily');
            }
          });
      }
    }
})

.controller('DailyController', function($scope, $routeParams, $route, $http, $location, IntercomAuthenticate, ActiveUser) {
    $scope.todaysDate = new Date();
    $scope.pageClass = 'page-daily';

    $http({
        method  : 'GET',
        url     : '/2/details'
    })
    .success(function(data) {
        if(data.daily != undefined && data.today != undefined) {
            IntercomAuthenticate(data.email);
            ActiveUser(data.email);

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
    })
    .then(function() {
        return $http({
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
        });
    });
})

.controller('SpendController', function($scope, $routeParams, $http, $location, $route, $timeout, ActiveUser, IntercomTrackEvent) {
    $scope.pageClass = 'page-spend';

    $scope.amountCents = "";

    setTimeout(function() { $('#spend').trigger('touchstart'); }, 700);
    //event handler to set the focus()
    $('#spend').on('touchstart', function () {
        $(this).focus();   // inside this function the focus works
    });
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
            IntercomTrackEvent('spent-money');
            $location.path('/daily');
        }
      });
    }
})

.controller('BucketsController', function($scope, $routeParams, $http, $location, IntercomTrackEvent) {
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
        url     : '/2/details'
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
            IntercomTrackEvent('saved-money');
            $location.path('/daily');
        }
      });
    }
})

.controller('PremiumController', function($scope, $routeParams) {
    $scope.pageClass = 'page-premium';
})

.factory('ActiveUser', ['$window', function(win) {
    var activeUser;
    return function(userEmail) {
       if(userEmail) {
        activeUser = userEmail;
       }

       return activeUser;
    }
}])

.factory('IntercomAuthenticate', ['$window', function(win) {
    return function(userEmail) {
       Intercom('boot', {
          app_id: "ay3p9jeb",
          user_id: userEmail,
          last_request_at: Date.now
        });
    }
}])

.factory('IntercomTrackEvent', ['$window', 'ActiveUser', function(win, ActiveUser) {
    return function(eventName, metadata) {
        if(metadata === undefined) metadata = {};
        Intercom('trackEvent', eventName, metadata);
    }
}]);

