const express = require('express'),
http = require('http');
  
const hostname = 'localhost'; 
const port = 8080; 
const app = express();
const sample_server = http.createServer(app); 

var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser=require("body-parser");

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost';

sample_server.listen(port, hostname, () => { 
  console.log(`Server running at http://${hostname}:${port}/`); 
}); 

app.use(express.static(path.join(__dirname, '/../js')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cookieParser());

app.use(session({
  secret: 'secret token',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy',
  name: 'session cookie name'
}));

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/../login.html'));
});

app.get('/index', function(req, res) {
  if (typeof req.session.username === 'undefined') {
    res.redirect('/');
  }
  else {
    res.sendFile(path.join(__dirname, '/../index.html'));
  }
});


app.post('/loginInformation', function(req, res){  
  console.log("--------------------Signing In------------------------------");
  MongoClient.connect(url, {useUnifiedTopology: true}, function (err, client) {
    var db = client.db('loginData');
    var query = {name: req.body.username};

    req.session.username = req.body.username;
    req.session.save();

    console.log("Logged in User: " + req.session.username);

    db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
      if (findErr) throw findErr;

      if (result.length > 0 && result[0].password === req.body.password) {
        console.log("Validation Successfull");
      } 
      else {
        console.log("Invalid Credentials");
        res.send({message: 'Fail'});
      }
      client.close();
    });
  }); 

  res.send({ message: 'Success' });
});


app.post('/scoreInformation', function(req, res) {
  console.log("--------------------Storing Score------------------------------");
  var gameScore = req.body.score;
  MongoClient.connect(url, {useUnifiedTopology: true}, async function (err, client) {
    var db = client.db('loginData');

    var query = {name: req.session.username};
    var highScoreJob = () => { 
      return new Promise((resolve, reject) => {
        db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
          if (findErr) reject(findErr);
          if (gameScore > result[0].highscore ) {
            var newHighScore = { $set: {highscore: gameScore} };
            db.collection('loginRecords').updateOne(query, newHighScore, function(err, res) {
              if (err) reject(err);
              console.log("HighScore Updated!");
              resolve(1);
            });
          }
          else { 
            resolve(0); 
          }
        });
      });
    };

    var dateJob = () => { 
      console.log("--------------------Checking Date------------------------------");
      return new Promise((resolve, reject) => {
        var currentDate = new Date().toISOString().split('T')[0];
        var queryNew = {name: req.session.username, 'games.date': currentDate}

        db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
          if (findErr) reject(findErr);

          let counter = 0;
          let foundFlag = false;
          result[0].games.forEach(game => {
            if (game.date === currentDate) {
              console.log("Existing Record Found");
              foundFlag = true;

              if (game.scores.length < 10) {
                var queryAppendScore = { 
                  $push: { 
                    'games.$.scores': { 
                      $each: [gameScore]
                    }
                  }
                };
                db.collection('loginRecords').updateOne(queryNew, queryAppendScore, function(err, res) {
                  if (err) reject(err);
                  console.log("Scores Updated!");
                  resolve(1);
                });
              }
              else {
                console.log("Plays exceeded!!");
                resolve(0);              
              }
            }
            counter = counter + 1;
          });

          if (foundFlag === false) {
            var queryAddNewDate = {
              $push: {
                games: {
                  date: currentDate,
                  scores: [gameScore]
                }
              }
            };
            db.collection('loginRecords').updateOne(query, queryAddNewDate, function(err, res) {
              if (err) reject(err);
              console.log("New Date Entry Added!!");
              resolve(1);
            });
          }      
        });
      });
    };


    var scoreRes = await highScoreJob();
    var dateRes = await dateJob();
    client.close();

    if (dateRes === 1) { res.json({ message: 'Updated' }); }
    else { res.json({ message: 'Failed' }); }
  }); 
});

app.get('/displayUserInfo',function(req, res){ 
  var dataToSend = {"username": req.session.username, "highscore": 0, "message": "Allowed"};
  var scoreLength = 0;
  var currentDate = new Date().toISOString().split('T')[0];
  var query = {name: req.session.username};
  MongoClient.connect(url, {useUnifiedTopology: true}, async function (err, client) {
    var db = client.db('loginData');

    var displayInfoJob = () => { 
      return new Promise((resolve, reject) => {
        db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
          if (findErr) reject(findErr);
          dataToSend.highscore = result[0].highscore;

          result[0].games.forEach(game => {
            if (game.date === currentDate) {
              scoreLength = game.scores.length
              resolve(1);
            }
          });
          resolve(0);
        });
      });
    };

    var infoRes = await displayInfoJob();
    client.close();

    if (scoreLength === 10) {
      dataToSend.message = "Blocked";
    }

    res.json(dataToSend);
  });
})