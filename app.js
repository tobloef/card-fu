var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("./libs/gameManager").listen(http);
var dbm = require("./libs/databaseManager");
var favicon = require("serve-favicon");
<<<<<<< HEAD
var debug = require("debug")("app");
=======
var debug = require("debug")("http");
var mongo = require("mongodb");
var monk = require("monk");
var db = monk("localhost/cardjitsu");

var gameHandler = require("./game.js");
>>>>>>> 9d0fb4cd8ff0cf552e47c28e11e83e3e58ed745f

app.set("port", (process.env.PORT || 3000));
app.use(favicon(__dirname + "/public/images/node_favicon.ico"));
app.use(express.static("public"));

<<<<<<< HEAD
//User connects to server
=======
var users = db.get("users");

>>>>>>> 9d0fb4cd8ff0cf552e47c28e11e83e3e58ed745f
app.get("/", function(req, res) {
    //Will serve static page index.html
});

<<<<<<< HEAD
//If page doesn't exist
=======
app.get("/mongo", function(req, res) {
	users.find({}, {}, function(e, test) {
		res.send(test);
	});
});

// If page doesn't exist
>>>>>>> 9d0fb4cd8ff0cf552e47c28e11e83e3e58ed745f
app.get("*", function(req, res){
    res.send("404", 404);
});

//Start http server
http.listen(app.get("port"), function() {
    debug("Node app started on port %s", app.get("port"));
});
<<<<<<< HEAD
=======

io.on("connection", function(socket) {
	gameHandler(socket);
});
>>>>>>> 9d0fb4cd8ff0cf552e47c28e11e83e3e58ed745f
