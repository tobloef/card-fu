var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io").listen(http);
var favicon = require("serve-favicon");
var debug = require("debug")("http");
var mongo = require("mongodb");
var monk = require("monk");
var db = monk("localhost/cardjitsu");

var gameHandler = require("./game.js");

app.set("port", (process.env.PORT || 3000));
app.use(favicon(__dirname + "/public/images/node_favicon.ico"));
app.use(express.static("public"));

var users = db.get("users");

app.get("/", function(req, res) {
	// Will serve static page index.html
});

app.get("/mongo", function(req, res) {
	users.find({}, {}, function(e, test) {
		res.send(test);
	});
});

// If page doesn't exist
app.get("*", function(req, res){
	res.send("404", 404);
});

http.listen(app.get("port"), function() {
	debug("Node app started on port %s", app.get("port"));
});

io.on("connection", function(socket) {
	gameHandler(socket);
});
