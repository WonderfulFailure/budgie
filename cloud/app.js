
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/home', function(req, res) {
  res.render('home');
});

app.get('/budget', function(req, res) {
    res.render('budget');
});

app.get('/buckets', function(req, res) {
  res.render('buckets');
});

app.get('/daily', function(req, res) {
  var User = Parse.Object.extend('_User');
    var query = new Parse.Query(User);
    var userObj;
    var userTransactions;
    query.get('ivWt4BYMS0', {
        success: function(user) {
            console.log(user);
            userObj = user;
        },

        error: function(object, error) {
            // Error yo
            console.log(error);
        }

    })
    .then(function() {
        var Transactions = Parse.Object.extend('Transactions');
        var query = new Parse.Query(Transactions);
        query.equalTo('owner', userObj);
        return query.find({
          success: function(results) {
            userTransactions = results;
            console.log(results);
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
          }
        });
    })
    .then(function() {
        var User = Parse.Object.extend("User");
        var newUserObj = new User();
        newUserObj.set('objectId', 'ivWt4BYMS0');
        var totalTransactions = 0;
        for(var i = 0; i < userTransactions.length; i++) {
            totalTransactions += userTransactions[i].get('amount');
        }
        newUserObj.set('todaysBudget', userObj.get('dailyBudget') - totalTransactions);
        Parse.Cloud.useMasterKey();
        return newUserObj.save(null, {
            success: function(savedUser) {
                console.log('Saved todays budget');
            },
            error: function(erroredTransaction, error) {
                console.log(error);
                console.log(erroredTransaction);
                console.log('Error saving todays budget');
            }
        })
    })
    .then(function() {
        res.render('daily', { user: userObj, transactions: userTransactions });
    });
});

app.get('/goal', function(req, res) {
  res.render('goal');
});

app.get('/spend', function(req, res) {
  res.render('spend');
});

app.get('/save', function(req, res) {
  res.render('save');
});

app.get('/settings', function(req, res) {
  res.render('settings');
});

app.post('/spend-save', function(req, res) {
    var User = Parse.Object.extend('_User');
    var query = new Parse.Query(User);
    var userObj;
    var userTransactions;
    var amountInCents;
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
        var amount = req.body.amount;
        amountInCents = amount * 100;
        var Transaction = Parse.Object.extend("Transactions");
        var cashTrans = new Transaction();
        cashTrans.save({
            label: 'Cash via app',
            amount: amountInCents,
            owner: userObj
        }, {
            success: function(savedTransaction) {
                console.log('Saved transaction')
            },
            error: function(erroredTransaction, error) {
                console.log('Error saving emergency transactions');
            }
        })
    })
    .then(function() {
        var User = Parse.Object.extend("User");
        var query = new Parse.Query(User);
        var todaysBudget;
        query.get('ivWt4BYMS0', {
            success: function(userObj) {
                todaysBudget = userObj.get('todaysBudget');
                console.log('Todays Balance:' + todaysBudget);
            },
            error: function() {
                console.log('Error retrieving todays budget');
                res.send("-1");
            }
        })
        .then(function() {
            var userObj = new User();
            userObj.set('objectId', 'ivWt4BYMS0');
            userObj.set('todaysBudget', todaysBudget - amountInCents);
            Parse.Cloud.useMasterKey();
            return userObj.save(null, {
                success: function(savedUser) {
                    console.log('Saved todays budget');
                    res.send("0");
                },
                error: function(erroredTransaction, error) {
                    console.log(error);
                    console.log(erroredTransaction);
                    console.log('Error saving todays budget');
                    res.send("-1");
                }
            });
        });
    })
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
                            res.send("0");
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

app.get('/transactions', function(req, res) {
    var Transactions = Parse.Object.extend("Transactions");
    var User = Parse.Object.extend("User");
    var query = new Parse.Query(Transactions);
    var User = new User();
    User.id = 'ivWt4BYMS0';
    query.equalTo('owner', User);
    query.limit(8);
    query.ascending("updatedAt");
    query.find({
        success: function(transactions) {
            res.send(transactions);
        }
    });
});

app.get('/user', function(req, res) {
    var User = Parse.Object.extend("User");
    var query = new Parse.Query(User);
    query.equalTo('objectId', 'ivWt4BYMS0');
    query.first({
        success: function(transactions) {
            res.send(transactions);
        }
    });
});

// // Example reading from the request query string of an HTTP get request.
// app.get('/test', function(req, res) {
//   // GET http://example.parseapp.com/test?message=hello
//   res.send(req.query.message);
// });

// // Example reading from the request body of an HTTP post request.
// app.post('/test', function(req, res) {
//   // POST http://example.parseapp.com/test (with request body "message=hello")
//   res.send(req.body.message);
// });

// Attach the Express app to Cloud Code.
app.listen();
