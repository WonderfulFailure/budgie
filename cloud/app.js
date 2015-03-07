
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
