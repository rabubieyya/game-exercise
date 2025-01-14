var myGameArea;
var myGamePiece;
var myObstacles = [];
var myscore;
var startFlag = true;
var username = "";
var highscore = "";

function restartGame() {
  document.getElementById("myfilter").style.display = "none";
  document.getElementById("myrestartbutton").style.display = "none";
  myGameArea.stop();
  myGameArea.clear();
  myGameArea = {};
  myGamePiece = {};
  myObstacles = [];
  myscore = {};
  document.getElementById("canvascontainer").innerHTML = "";
  fetchUserInfo();
}

function startGame() {
  myGameArea = new gamearea();
  myGamePiece = new component(30, 30, "red", 10, 75);
  myscore = new component("15px", "Consolas", "black", 220, 25, "text");
  myGameArea.start();
}

function gamearea() {
  this.canvas = document.createElement("canvas");
  this.canvas.width = 320;
  this.canvas.height = 180;    
  document.getElementById("canvascontainer").appendChild(this.canvas);
  this.context = this.canvas.getContext("2d");
  this.pause = false;
  this.frameNo = 0;
  this.start = function() {
    this.interval = setInterval(updateGameArea, 20);
  }
  this.stop = function() {
    clearInterval(this.interval);
    this.pause = true;
  }
  this.clear = function(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function component(width, height, color, x, y, type) {

  this.type = type;
  if (type == "text") {
    this.text = color;
  }
  this.score = 0;    this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;    
  this.x = x;
  this.y = y;    
  this.update = function() {
    ctx = myGameArea.context;
    if (this.type == "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text, this.x, this.y);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  this.crashWith = function(otherobj) {
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      crash = false;
    }
    return crash;
  }
}

function updateGameArea() {
    var x, y, min, max, height, gap;
    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            myGameArea.stop();

            var scoreInfo = JSON.stringify({"score": myscore.score}); 

            fetch("http://localhost:8080/scoreInformation", { 
            
            // Adding method type 
            method: "POST", 
            
            // Adding body or contents to send s
            body: scoreInfo, 
            
            // Adding headers to the request 
            headers: { 
                "Content-type": "application/json; charset=UTF-8"
            } 
            }) 
            .then(function(response) {
              return response.json();
            })
            .then(function(json) {
            }); 

            document.getElementById("myfilter").style.display = "block";
            document.getElementById("myrestartbutton").style.display = "block";
            return;
        } 
    }
    if (myGameArea.pause == false) {
        myGameArea.clear();
        myGameArea.frameNo += 1;
        myscore.score +=1;        
        if (myGameArea.frameNo == 1 || everyinterval(150)) {
            x = myGameArea.canvas.width;
            y = myGameArea.canvas.height - 100;
            min = 20;
            max = 100;
            height = Math.floor(Math.random()*(max-min+1)+min);
            min = 50;
            max = 100;
            gap = Math.floor(Math.random()*(max-min+1)+min);
            myObstacles.push(new component(10, height, "green", x, 0));
            myObstacles.push(new component(10, x - height - gap, "green", x, height + gap));
        }
        for (i = 0; i < myObstacles.length; i += 1) {
            myObstacles[i].x += -1;
            myObstacles[i].update();
        }
        myscore.text="SCORE: " + myscore.score;  
        myscore.update();
        myGamePiece.x += myGamePiece.speedX;
        myGamePiece.y += myGamePiece.speedY;    
        myGamePiece.update();
    }
}

function everyinterval(n) {
    if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
    return false;
}

function checkKey(e) {

  e = e || window.event;

  if (e.keyCode == '38') {
    moveup(e);
  }
  else if (e.keyCode == '40') {
    movedown()
  }
  else if (e.keyCode == '37') {
    moveleft()
  }
  else if (e.keyCode == '39') {
    moveright()
  }

}

function moveup(e) {
    myGamePiece.speedY = -1; 
}

function movedown() {
    myGamePiece.speedY = 1; 
}

function moveleft() {
    myGamePiece.speedX = -1; 
}

function moveright() {
    myGamePiece.speedX = 1; 
}

function clearmove(e) {
    myGamePiece.speedX = 0; 
    myGamePiece.speedY = 0; 
}

function fetchUserInfo() {
  fetch("http://localhost:8080/displayUserInfo")
    .then(response => {
      return response.json();
    })
    .then(data => {
      username = data.username;
      highscore = data.highscore;
      
      if (data.message === "Blocked") { 
        alert("You have exhausted your playes. Please come back tomorrow");
        startFlag = false ;
      }
      else { 
        displayUserInfo();
        startGame();
      }
    });
}

function displayUserInfo() {
  var para = document.createElement("P");

  document.getElementById("username").innerHTML = username;
  document.getElementById("highscore").innerHTML = highscore;
}

fetchUserInfo();