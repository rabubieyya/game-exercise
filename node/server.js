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
    var query = {name: req.body.username, password: req.body.password};

    req.session.username = req.body.username;
    req.session.save();

    console.log("Logged in User: " + req.session.username);

    db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
      if (findErr) throw findErr;

      if (result.length==0) {
        console.log("Invalid Credentials");
        res.send({message: 'Fail'});
      } 
      else {
        console.log("Validation Successfull");
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

    console.log("UserName for this session is " + req.session.username);

    var databaseJob = () => { 
      return new Promise((resolve, reject) => {
        db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
          if (findErr) reject(findErr);
          if (gameScore > result[0].highscore ) {
            var newHighScore = { $set: {highscore: gameScore} };
            db.collection('loginRecords').updateOne(query, newHighScore, function(err, res) {
              if (err) reject(err);
              console.log("HighScore Updated!");
              resolve(res);
            });
          }

        });
      });
    };

    
    var dateJob = () => { 
      console.log("--------------------Checking Date------------------------------");
      return new Promise((resolve, reject) => {
        var currentDate = (new Date()).toISOString().split('T')[0];
        db.collection('loginRecords').find( query, { 'games.date': currentDate } ).toArray(function(findErr, result) { 
          if (findErr) reject(findErr);
          if(result[0].games[0].date) {
            console.log("date is already there, now check length of array");
          }
          var scoresLength = result[0].games[0].scores.length;
          var scoreToAppend = { $push: {  result[0].games[0].scores: gameScore } }
          if(scoresLength<10) {
            db.collection('loginRecords').updateOne(query, scoreToAppend, function(err, res) {
              if (err) reject(err);
              console.log("Scores Updated!");
              resolve(res);
            });
          }

          // if (gameScore > result[0].highscore ) {
          //   var newHighScore = { $set: {highscore: gameScore} };
          //   db.collection('loginRecords').updateOne(query, newHighScore, function(err, res) {
          //     if (err) reject(err);
          //     console.log("HighScore Updated!");
          //     resolve(res);
          //   });
          // }
        });
      });
    };

    var result = await databaseJob();
    console.log(result);
    var dateRes = await dateJob();
    console.log("--------------------");
    console.log(dateRes);
    client.close();
  }); 

  res.json({ message: 'Success' });
});
