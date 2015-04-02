
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var moment  = require('cloud/moment');
var app = express();
var parseExpressCookieSession = require('parse-express-cookie-session');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body
app.use(allowCrossDomain);        // Middleware for CORS
app.use(express.methodOverride());
app.use(express.cookieParser('SECRET_SIGNING_KEY'));
app.use(parseExpressCookieSession({
  fetchUser: true,
  key: 'budgie.sess',
  cookie: {
    maxAge: 3600000 * 24 * 30
  }
}));

function requireHTTPS(req, res, next) {
    if (!req.secure) {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

// Make sure all requests use https
app.use(requireHTTPS);

/*
    =====
    Pages
    =====
 */
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
    var username = req.body.username.toLowerCase();
    var password = req.body.password;

    var user = new Parse.User();
    user.set('username', username);
    user.set('email', username);
    user.set('password', password);
    user.set('monthlyBudget', 0);
    user.set('dailyBudget', 0);
    user.set('todaysBudget', 0);

    user.signUp().then(function(user) {
        var Buckets = Parse.Object.extend("Buckets");
        var bucket = new Buckets();
        bucket.set('owner', user);
        bucket.set('progress', 0);
        bucket.set('goal', 6500);
        bucket.set('title', 'New Video Game');
        bucket.save(null, {
            success: function() {
                res.send({"code": 0, "message": "Successfully signed up"});
            },
            error: function(error) {
                res.send(error);
            }
        });
    }, function(error) {
        res.send(error);
    });
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', function(req, res) {
    Parse.User.logIn(req.body.username.toLowerCase(), req.body.password).then(function(user) {
        res.send({"code": 0, "message": "Successfully logged in", "token": user.getSessionToken()});
    }, function(error) {
        res.send({"code": error.code, "message": error.message});
    });
});

app.get('/logout', function(req, res) {
    Parse.User.logOut();
    res.redirect('/');
});

app.post('/logout', function(req, res) {
    Parse.User.logOut();
    res.send({"code": 0, "message": "Successfully logged out"});
});

app.get('/buckets', function(req, res) {
  res.render('buckets');
});

app.get('/daily', function(req, res) {
    res.render('daily');
});

app.get('/spend', function(req, res) {
  res.render('spend');
});

app.get('/settings', function(req, res) {
  res.render('settings');
});

app.get('/welcome', function(req, res) {
  res.render('welcome');
});

/*
    =============
    API endpoints
    =============
*/

app.get('/2/transactions', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('GetUserTransactions', {}, {
          success: function(result) {
            res.send(result);
          },
          error: function(error) {
            res.send(error);
          }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1"});
    }
});

app.post('/2/transactions', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('AddTransaction', {"amount": req.body.amount}, {
          success: function(result) {
            res.send(result);
          },
          error: function(error) {
            res.send(error);
          }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1"});
    }
});

app.get('/2/buckets', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('GetUserBuckets', {}, {
          success: function(result) {
            res.send(result);
          },
          error: function(error) {
            res.send(error);
          }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1"});
    }
});

app.post('/2/buckets', function(req, res) {
    var currentUser = Parse.User.current();
    if(currentUser) {
        Parse.Cloud.run('AddBucketContribution', {"amount": req.body.amount}, {
            success: function(result) {
                res.send(result);
            },
            error: function(error) {
                res.send(error);
            }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1" });
    }
});

app.get('/2/details', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('CalculateDailyBalance', {}, {
            success: function(result) {
                res.send({"email": currentUser.get('email'), "daily": currentUser.get('dailyBudget'), "today": result.today});
            },
            error: function(error) {
                res.send(error);
            }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1"});
    }
});

app.get('/2/settings', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('GetUserBuckets', {}, {
            success: function(result) {
                var monthlyBudget = currentUser.get('monthlyBudget') || 0;
                var bucketName = result.get('title') || '';
                var bucketGoal = result.get('goal') || 0;
                res.send({ "monthlyBudget": monthlyBudget, "bucketName": bucketName, "bucketGoal": bucketGoal });
            },
            error: function(error) {
                res.send(error);
            }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1"});
    }
});

app.post('/2/settings', function(req, res) {
    var currentUser = Parse.User.current();
    if(currentUser) {
        currentUser.set('monthlyBudget', parseInt(req.body.monthlyBudget));
        currentUser.set('dailyBudget', parseInt(req.body.monthlyBudget / 30));

        if(!currentUser.get('lastDailyBudgetUpdate')) {
            var today = new Date();
            today.setHours(0,0,0,0);
            currentUser.set('lastDailyBudgetUpdate', today);
            currentUser.set('todaysBudget', parseInt(req.body.todaysBudget));
        }
        currentUser.save(null, {
            success: function(result) {
                var Buckets = Parse.Object.extend('Buckets');
                var query = new Parse.Query(Buckets);
                query.equalTo('owner', currentUser);
                query.first({
                  success: function(Bucket) {
                    if(req.body.bucketName) {
                        Bucket.set('title', req.body.bucketName);
                    }

                    if(req.body.bucketGoal) {
                        Bucket.set('goal', parseInt(req.body.bucketGoal));
                    }

                    Bucket.save(null, {
                        success: function() {
                            res.send({'code': 0, 'message': 'Settings saved successfully'});
                        },
                        error: function(error) {
                            res.send({ "error": error.message, "code": error.code });
                        }
                    });
                  },
                  error: function(error) {
                    res.send({ "error": error.message, "code": error.code });
                  }
                });
            },
            error: function(error) {
                res.send(error);
            }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1" });
    }
});

/*
    ===============
    Cloud Functions
    ===============
 */

Parse.Cloud.define("GetUserTransactions", function(request, response) {
    var Transactions = Parse.Object.extend('Transactions');
    var query = new Parse.Query(Transactions);

    // 11AM UTC, or 4AM PST
    var now = moment(new Date()).utc().startOf('day').hours('11');

    // The current time in PST
    var now_local = moment(new Date()).utc().utcOffset('-0700').startOf('day');

    // Generally this will be zero, but there will be times when UTC gets a day ahead of PST,
    // so it needs to be accounted for
    var daysDiff = now.diff(now_local, 'days');

    // The start date for looking up transactions (11AM UTC of the day)
    var startingFrom = now.utc().subtract(daysDiff, 'days').hours('11');

    query.equalTo('owner', request.user);
    query.limit(8);
    query.descending("createdAt");
    query.greaterThan("createdAt", startingFrom.toISOString());
    query.find({
      success: function(results) {
        response.success(results);
      },
      error: function(error) {
        response.error(error.message);
      }
    });
});

Parse.Cloud.define("AddTransaction", function(request, response) {
    var Transaction = Parse.Object.extend("Transactions");
    var cashTrans = new Transaction();

    var amount = request.params.amount;
    var amountInCents = amount * 100;
    var label = 'Cash via app';
    if(request.params.label) label = request.params.label;

    cashTrans.save({
        label: label,
        amount: amountInCents,
        owner: request.user
    }, {
        success: function(savedTransaction) {
            response.success({ "code": 0, "message": "Saved transaction successfully"});
        },
        error: function(erroredTransaction, error) {
            response.error({ "error": error.message, "code": error.code });
        }
    });
});

Parse.Cloud.afterSave("Transactions", function(request) {
    var currentUser = Parse.User.current();

    // Only update if there is a transaction to update
    if(request.object) {
        var currentUser = request.user;
        var amountInCents = request.object.get('amount');
        currentUser.increment('todaysBudget', -amountInCents);
        currentUser.save(null, {
            success: function(result) {
            },
            error: function(errorUser, error) {
                console.error(error);
            }
        })
    }
});

Parse.Cloud.define("GetUserBuckets", function(request, response) {
    var Buckets = Parse.Object.extend('Buckets');
    var query = new Parse.Query(Buckets);
    query.equalTo('owner', request.user);
    query.first({
      success: function(results) {
        response.success(results);
      },
      error: function(error) {
        response.error({ "error": error.message, "code": error.code });
      }
    });
});

Parse.Cloud.define("AddBucketContribution", function(request, response) {
    var Buckets = Parse.Object.extend('Buckets');
    var query = new Parse.Query(Buckets);
    var amount = request.params.amount;
    var amountInCents = amount * 100;

    query.equalTo('owner', request.user);
    query.first({
      success: function(Bucket) {
        Bucket.increment('progress', amountInCents);
        Bucket.save(null, {
            success: function() {
                Parse.Cloud.run('AddTransaction', {"amount": amount, "label": Bucket.get('title')}, {
                  success: function(result) {
                    response.success({ "message": "Saved bucket contribution successfully" });
                  },
                  error: function(error, errorDetails) {
                    response.error(errorDetails.message);
                  }
                });
            },
            error: function(error, errorDetails) {
                response.error(errorDetails.message);
            }
        })
      },
      error: function(error, errorDetails) {
        response.error(errorDetails.message);
      }
    });
});

Parse.Cloud.define("CalculateDailyBalance", function(request, response) {
    var currentUser = Parse.User.current();

    // The day 'starts' at 11AM UTC
    // Currently calculated from 4AM PDT
    var lastUpdate = moment(new Date(currentUser.get('lastDailyBudgetUpdate'))).utc().startOf('day').hours('11');
    var today = moment(new Date()).utc();
    var diffDays = today.diff(lastUpdate, 'days');

    // Only change the balance if it's been more than 24h
    if(diffDays > 0) {
        var dailyBudget = currentUser.get('dailyBudget');

        currentUser.increment('todaysBudget', dailyBudget * diffDays);
        currentUser.set('lastDailyBudgetUpdate', today.utc().toDate());
        currentUser.save(null, {
            success: function(result) {
                response.success({"code": 0, "today": result.get('todaysBudget')});
            },
            error: function(error, errorDetails) {
                response.error(errorDetails.message);
            }
        });
    }
    else {
        response.success({"code": 0, "today": currentUser.get('todaysBudget')});
    }
});

Parse.Cloud.job("DailyBalance", function(request, status) {
    // Set up to modify user data
    Parse.Cloud.useMasterKey();
    var counter = 0;
    // Query for all users
    var query = new Parse.Query(Parse.User);
    query.each(function(user) {
        // The day 'starts' at 11AM UTC
        // Currently calculated from 4AM PDT
        var lastUpdate = moment(new Date(user.get('lastDailyBudgetUpdate'))).utc().startOf('day').hours('11');
        var today = moment(new Date()).utc();
        var diffDays = today.diff(lastUpdate, 'days');

        // Only change the balance if it's been more than 24h
        if(diffDays > 0) {
            var dailyBudget = user.get('dailyBudget');
            user.increment('todaysBudget', dailyBudget * diffDays);
            user.set('lastDailyBudgetUpdate', today.utc().toDate());
        }
        return user.save();
    }).then(function() {
        status.success("DailyBalance ran successfully.");
    }, function(error) {
        status.error("Error while running DailyBalance:" + error);
    });
});


/* Hey!  Listen! */
app.listen();
