const express = require('express'), 
http = require('http'); 
// var session = require('client-sessions');
  
const hostname = 'localhost'; 
const port = 8080; 
const app = express();
 
  
const sample_server = http.createServer(app); 
  
sample_server.listen(port, hostname, () => { 
  console.log(`Server running at http://${hostname}:${port}/`); 
}); 


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// app.use(session({
//   cookieName: 'session',
//   secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
//   duration: 30 * 60 * 1000,
//   activeDuration: 5 * 60 * 1000,
//   httpOnly: true,
//   secure: true,
//   ephemeral: true
// }));

var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({
  secret: 'secret token',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy',
  name: 'session cookie name'
}));


var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

app.post('/loginInformation', function(req, res){  
  console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII");
  console.log(req.body);
  
  var MongoClient = require('mongodb').MongoClient;
  var url = 'mongodb://localhost';

  MongoClient.connect(url, {useUnifiedTopology: true}, function (err, client) {

    var db = client.db('loginData');

    // var name = req.body.username;
    // var password = req.body.password;
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    req.session.save();

    console.log("-------------"+JSON.stringify(req.session));
    var query = {name: req.body.username, password: req.body.password};

    console.log("USERName from session is in login "+req.session.username);
    console.log("Password from session is in login"+req.session.password);

    db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
      if (findErr) throw findErr;
      if(result.length==0) {console.log("No matches");} 
      else {console.log(result);}
      client.close();
    });

  }); 

  res.send({ message: 'Success' });
});


app.post('/scoreInformation', function(req, res){  
  console.log(" BEFORE BYEEEEEEEEEEEEEEEEEEEEEEEEEEE");
  console.log(JSON.stringify(req.session));
  console.log("BYEEEEEEEEEEEEEEEEEEEEEEEEEEE");
  console.log(req.body);
  
  var MongoClient = require('mongodb').MongoClient;
  var url = 'mongodb://localhost';

  MongoClient.connect(url, {useUnifiedTopology: true}, function (err, client) {

    var db = client.db('loginData');
    // if (req.session && req.session.user) {
      var query = {name: req.session.username, password: req.session.password};

      console.log("USERName from session is "+req.session.username);
      console.log("Password from session is "+req.session.password);

      db.collection('loginRecords').find(query).toArray(function(findErr, result) { 
        if (findErr) throw findErr;
        console.log(result);
        client.close();
      });
    // }

  }); 

  res.json({ message: 'Success' });
});