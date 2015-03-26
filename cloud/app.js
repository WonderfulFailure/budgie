
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();
var parseExpressCookieSession = require('parse-express-cookie-session');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body
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
        res.send({"code": 0, "message": "Successfully logged in"});
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

app.get('/2/balance', function(req, res) {
    var currentUser = Parse.User.current();
    if (currentUser) {
        Parse.Cloud.run('CalculateDailyBalance', {}, {
            success: function(result) {
                res.send({"daily": currentUser.get('dailyBudget'), "today": result.today});
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
                    Bucket.set('title', req.body.bucketName);
                    Bucket.set('goal', parseInt(req.body.bucketGoal));
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

app.post('/spend-save-sms', function(req, res) {
    var User = Parse.Object.extend('_User');
    var query = new Parse.Query(User);
    var userObj;
    var userTransactions;
    Parse.Cloud.useMasterKey();
    query.get('ivWt4BYMS0', {
        success: function(user) {
            userObj = user;
        },

        error: function(object, error) {
            // Error yo
            console.log(error);
        }

    })
    .then(function() {
        var amount = parseFloat(req.body.text);
        var amountInCents = Math.round(amount * 100);
        var Transaction = Parse.Object.extend("Transactions");
        var cashTrans = new Transaction();
        if(!amount) {
            return Parse.Cloud.httpRequest({
                          method: "POST",
                          url: "https://rest.nexmo.com/sms/json",
                          body: {
                             api_key: 'b2d131d2',
                             api_secret: '7b5388b8',
                             from: req.body.to,
                             to: req.body.msisdn,
                             text: "Pweeep! Today's budget is $" + parseFloat(userObj.get('todaysBudget') / 100).toFixed(2) + '!'
                          },
                          success: function(httpResponse) {
                            console.log(httpResponse.text);
                            res.send(0);
                          },
                          error: function(httpResponse) {
                            console.error('Request failed with response code ' + httpResponse.status);
                          }
                        });
        }
        return cashTrans.save({
            label: 'Cash via SMS',
            amount: amountInCents,
            owner: userObj
        }, {
            success: function(savedTransaction) {
                userObj.increment('todaysBudget', parseInt(-1 * amountInCents));
                userObj.save(null, {
                    success: function(savedUser) {
                        Parse.Cloud.httpRequest({
                          method: "POST",
                          url: "https://rest.nexmo.com/sms/json",
                          body: {
                             api_key: 'b2d131d2',
                             api_secret: '7b5388b8',
                             from: req.body.to,
                             to: req.body.msisdn,
                             text: "Bwraaaak! Cash Transaction for $" + parseFloat(amount).toFixed(2) + " has been recorded.  Your new budget for today is $" + parseFloat(savedUser.get('todaysBudget') / 100).toFixed(2) + '.'
                          },
                          success: function(httpResponse) {
                            console.log(httpResponse.text);
                            res.send(0);
                          },
                          error: function(httpResponse) {
                            console.error('Request failed with response code ' + httpResponse.status);
                          }
                        });
                    },
                    error: function(erroredUser, error) {
                        console.log(erroredUser);
                        console.log(error);
                        console.log('Failed to todays budget');
                    }
                });
            },
            error: function(erroredTransaction, error) {
                console.log('Failed to send text to recipient');
                res.send("-1");
            }
        })
    });
});

/*
    ===============
    Cloud Functions
    ===============
 */

Parse.Cloud.define("GetUserTransactions", function(request, response) {
    var Transactions = Parse.Object.extend('Transactions');
    var query = new Parse.Query(Transactions);
    var today = new Date();
    console.log(today);
    today.setHours(0,0,0,0);
    console.log(today);
    query.equalTo('owner', request.user);
    query.limit(8);
    query.descending("createdAt");
    query.greaterThanOrEqualTo("createdAt", today);
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
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    var lastUpdate = new Date(currentUser.get('lastDailyBudgetUpdate'));
    lastUpdate.setHours(0,0,0,0);
    var today = new Date();
    today.setHours(0,0,0,0);
    var diffDays = Math.round(Math.abs((lastUpdate.getTime() - today.getTime())/(oneDay)));

    // Only change the balance if it's been more than 24h
    if(diffDays > 0) {
        var dailyBudget = currentUser.get('dailyBudget');

        currentUser.increment('todaysBudget', dailyBudget * diffDays);
        currentUser.set('lastDailyBudgetUpdate', today);
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


/* Hey!  Listen! */
app.listen();
