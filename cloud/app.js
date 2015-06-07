
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var moment  = require('cloud/moment');
var app = express();
var parseExpressCookieSession = require('parse-express-cookie-session');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var Buffer = require('buffer').Buffer;

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

/*
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
*/

/*
    =============
    API endpoints
    =============
*/

/*
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

*/

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

Parse.Cloud.define("GetAllUserTransactions", function(request, response) {
    var Transactions = Parse.Object.extend('Transactions');

    var transactionsQuery = new Parse.Query(Transactions);
    var legacyTransactionsQuery = new Parse.Query(Transactions);

    transactionsQuery.equalTo('owner', request.user);
    transactionsQuery.equalTo('type', 'spend');
    transactionsQuery.notEqualTo('deleted', true);

    legacyTransactionsQuery.equalTo('owner', request.user);
    legacyTransactionsQuery.equalTo('label', 'Cash via app');
    legacyTransactionsQuery.doesNotExist('type');
    legacyTransactionsQuery.notEqualTo('deleted', true);

    var query = Parse.Query.or(transactionsQuery, legacyTransactionsQuery);
    query.descending("createdAt");
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
    var type = request.params.type || 'spend';
    if(request.params.label) label = request.params.label;

    cashTrans.save({
        label: label,
        amount: amountInCents,
        owner: request.user,
        type: type,
        ACL: new Parse.ACL(request.user)
    }, {
        success: function(savedTransaction) {
            response.success({ "code": 0, "message": "Saved transaction successfully", "transaction": savedTransaction });
        },
        error: function(erroredTransaction, error) {
            response.error({ "error": error.message, "code": error.code });
        }
    });
});

Parse.Cloud.define("DeleteTransaction", function(request, response) {
    var transId = request.params.id;

    var Transaction = Parse.Object.extend("Transactions");
    var query = new Parse.Query(Transaction);

    var currentUser = Parse.User.current();

    if(transId) {
        query.equalTo('objectId', transId);
        query.equalTo('owner', currentUser);
        query.notEqualTo('deleted', true);
        query.first({
            success: function(transaction) {
                if(transaction) {
                    transaction.set('deleted', true);
                    transaction.save({}, {
                        success: function(savedTransaction) {
                            response.success({ "code": 0, "message": "Removed transaction successfully"});
                        },
                        error: function(erroredTransaction, error) {
                            response.error({ "error": error.message, "code": error.code });
                        }
                    });
                }
                else {
                    response.error('invalid transaction id');
                }
            },
            error: function(error) {
                response.error('invalid transaction id');
            }
        });
    }
    else {
        response.error("invalid transaction id");
    }
});

Parse.Cloud.afterSave("Transactions", function(request) {
    var currentUser = Parse.User.current();

    // Only update if there is a transaction to update
    if(request.object) {
        var currentUser = request.user;
        var amountInCents = request.object.get('amount');

        // Skip deleted transactions
        var modifier = -1;
        if(request.object.get('deleted')) modifier = 1;

        currentUser.increment('todaysBudget', modifier * amountInCents);
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
        Bucket.setACL(new Parse.ACL(Parse.User.current()));
        Bucket.save(null, {
            success: function() {
                Parse.Cloud.run('AddTransaction', {"amount": amount, "label": Bucket.get('title'), "type": "save"}, {
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

Parse.Cloud.define("UpdateUserSettings", function(request, response) {
    var currentUser = Parse.User.current();
    if(currentUser) {
        if(request.params.monthlyBudget) {
            currentUser.set('monthlyBudget', parseInt(request.params.monthlyBudget));
            currentUser.set('dailyBudget', parseInt(request.params.monthlyBudget / 30));
        }

        if(!currentUser.get('lastDailyBudgetUpdate')) {
            var today = new Date();
            currentUser.set('lastDailyBudgetUpdate', today);

            if(request.body.todaysBudget)
                currentUser.set('todaysBudget', parseInt(request.body.todaysBudget));
        }

        if(request.params.deviceToken) {
            currentUser.set('deviceToken', request.params.deviceToken);
        }

        if(request.params.allowanceReminders && request.params.allowanceReminders == "false") {
            currentUser.set('allowanceReminders', false);
        } else {
            currentUser.set('allowanceReminders', true);
        }
        
        currentUser.save(null, {
            success: function(result) {
                var Buckets = Parse.Object.extend('Buckets');
                var query = new Parse.Query(Buckets);
                query.equalTo('owner', currentUser);
                query.first({
                  success: function(Bucket) {
                    if(!Bucket) {
                        Bucket = new Buckets();
                        Bucket.set('owner', currentUser);
                        Bucket.set('progress', 0);
                        Bucket.setACL(new Parse.ACL(currentUser));
                    }

                    if(request.params.bucketName) {
                        Bucket.set('title', request.params.bucketName);
                    }

                    if(request.params.bucketGoal) {
                        Bucket.set('goal', parseInt(request.params.bucketGoal));
                    }

                    Bucket.save(null, {
                        success: function(result) {
                            console.log(result);
                            response.success({'code': 0, 'message': 'Settings saved successfully'});
                        },
                        error: function(error) {
                            response.error({ "error": error.message, "code": error.code });
                        }
                    });
                  },
                  error: function(error) {
                    response.error({ "error": error.message, "code": error.code });
                  }
                });
            },
            error: function(error) {
                response.error(error);
            }
        });
    } else {
        res.send({ "error": "Must be logged in", "code": "-1" });
    }
});
/*
Parse.Cloud.beforeSave("Buckets", function(request, response) {
    Parse.Cloud.useMasterKey();
    var user = request.user;
    request.object.setACL(new Parse.ACL(user));
    response.success();
});

Parse.Cloud.beforeSave("Transactions", function(request, response) {
    Parse.Cloud.useMasterKey();
    var user = request.user;
    request.object.setACL(new Parse.ACL(user));
    response.success();
});
*/
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
    Parse.Cloud.useMasterKey();
    request.object.setACL(new Parse.ACL(request.object.get('objectId')));
    response.success();
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
        var diffDays = Math.abs(today.diff(lastUpdate, 'days'));

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

Parse.Cloud.job("DailyBalanceReminder", function(request, status) {
    var currencies = [
        {
          'currency': 'usd',
          'character': '$',
          'character_unicode': "\u0024",
          'placeholder': '00.00',
          'decimalPlaces': 2,
          'centsToWhole': 100,
          'icon': 'fa-usd',
          'format': 'left',
          'sliderUnit': 1
        },
        {
          'currency': 'gbp',
          'character': '£',
          'character_unicode': "\u00A3",
          'placeholder': '00.00',
          'decimalPlaces': 2,
          'centsToWhole': 100,
          'icon': 'fa-gbp',
          'format': 'left',
          'sliderUnit': 1
        },
        {
          'currency': 'euro',
          'character': '€',
          'character_unicode': "\u20AC",
          'placeholder': '00.00',
          'decimalPlaces': 2,
          'centsToWhole': 100,
          'icon': 'fa-euro',
          'format': 'left',
          'sliderUnit': 1
        },
        {
          'currency': 'yen',
          'character': '¥',
          'character_unicode': "\u00A5",
          'placeholder': '00.00',
          'decimalPlaces': 2,
          'centsToWhole': 100,
          'icon': 'fa-yen',
          'format': 'left',
          'sliderUnit': 1
        },
        {
          'currency': 'lira',
          'character': '₺',
          'character_unicode': "\u20BA",
          'placeholder': '00.00',
          'decimalPlaces': 2,
          'centsToWhole': 100,
          'icon': 'fa-try',
          'format': 'left',
          'sliderUnit': 1
        }
    ];

    function getCurrency(key) {
        for(var i in currencies) {
          var currency = currencies[i];
          if(currency.currency == key) {
            return currency;
          }
        }

        return currencies[0];
    }

    function toWhole(amountInCents, currency) {
        if(typeof currency === 'undefined') currency = currencies[0];
        var divisor = currency.centsToWhole;
        return parseFloat(amountInCents / divisor).toFixed(currency.decimalPlaces);
    }

    function toDisplay(amountInCents, currency) {
        amountInCents = Math.round(amountInCents);
        currentCurrency = currency;
        if(currentCurrency) {
          var negativeSymbol = "";
          if(amountInCents < 0) {
            negativeSymbol = "-";
            amountInCents = Math.abs(amountInCents);
          }
          return negativeSymbol + currentCurrency.character_unicode + toWhole(amountInCents, currentCurrency);
        }
    }
    
    // Set up to modify user data
    Parse.Cloud.useMasterKey();
    var counter = 0;
    // Query for all users
    var query = new Parse.Query(Parse.User);
    query.each(function(user) {
        var deviceToken = user.get('deviceToken');

        if(deviceToken && user.get('allowanceReminders') !== false) {
            var currency = getCurrency(user.get('currency'));
            var tBWhole = toDisplay(user.get('todaysBudget'), currency);

            var msg = "Bwraaak!  Your allowance today is " + tBWhole + "!";
            var noteBody = {
              "tokens":[
                deviceToken
              ],
              "notification":{
                "alert": msg,
                "ios":{
                    "sound": "www/sounds/spend.wav",
                    "contentAvailable": true,
                },
                "android":{
                  "delayWhileIdle":true,
                }
              }
            }

            var buf = new Buffer('07e9ea0648e6a6f507e91a2914237509230499c70c4eaf9f', 'utf8');
            var base64 = buf.toString('base64');

            Parse.Cloud.httpRequest({
                url: 'https://push.ionic.io/api/v1/push',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'X-Ionic-Application-Id': 'b306568f',
                    'Authorization': 'Basic ' + base64 + ':'
                },
                body: JSON.stringify(noteBody),
                success: function(httpResponse) {
                    console.log('Successfully sent push notification');
                },
                error: function(httpResponseError) {
                    console.log('Error sending push');
                    console.log(httpResponseError);
                }
            });
        }

        return true;
    }).then(function() {
        status.success("DailyBalanceReminder ran successfully.");
    }, function(error) {
        status.error("Error while running DailyBalanceReminder:" + error);
    });
});

/*

    Warning: Make sure to comment out the afterSave functino for transactions
    otherwise this will trigger it

Parse.Cloud.job("ACLCleanup", function(request, status) {
    // Set up to modify user data
    Parse.Cloud.useMasterKey();
    var counter = 0;
    // Query for all users
    var Transaction = Parse.Object.extend("Transactions");
    var query = new Parse.Query(Transaction);
    query.limit(1000);
    query.find(function(trans) {
        //console.log(trans.length);
        for (var i = 0; i < trans.length; i++) {
            var ownerId = trans[i].get("owner");
            var newACL = new Parse.ACL();
            newACL.setReadAccess(ownerId,true);
            newACL.setWriteAccess(ownerId,true);
            trans[i].setACL(newACL);
            trans[i].save(null, {
                success:function(result) {
                    console.log('success');
                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
        //return true;
    });
});
*/


/* Hey!  Listen! */
app.listen();
