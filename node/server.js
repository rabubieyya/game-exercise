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


app.post('/scoreInformation', function(req, res){  
  console.log("--------------------Storing Score------------------------------");
  var gameScore = req.body.score;
  console.log("Highscore from game is "+gameScore);
  await MongoClient.connect(url, {useUnifiedTopology: true}, function (err, client) {
    var db = client.db('loginData');
    var query = {name: req.session.username};

    console.log("UserName for this session is " + req.session.username);

    db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
      if (findErr) throw findErr;
      console.log("Highscore from db is "+result[0].highscore);
      if(gameScore>result[0].highscore) {
        console.log("Entering if");
        var newHighScore = { $set: {highscore: gameScore} };
        db.collection('loginRecords').updateOne(query, newHighScore, function(err, res) {
          if (err) throw err;
          console.log("HighScore Updated!");
          // db.close();
        });
      }
      client.close();
    });
  }); 

  res.json({ message: 'Success' });
});