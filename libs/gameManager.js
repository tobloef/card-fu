var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");


var players = [];
var queue = [];

//////////  Socket.io  \\\\\\\\\\
module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on("connection", function(socket) {

		socket.on("username submit", function(desiredUsername) {
			processUsername(desiredUsername, socket);
		});

		socket.on("enter queue", function() {
			enterQueue(socket);
		});

		socket.on("get stats", function() {
			sendStats(socket);
		});
	});
	return io;
};


//////////  Methods  \\\\\\\\\\
function findPlayerByUsername(username) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < players.length; i++) {
		if (players[i].username === username) {
			return players[i];
		}
	}
	return false;
}

function findPlayerById(id) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < players.length; i++) {
		if (players[i].socketId === id) {
			return players[i];
		}
	}
	return false;
}

function processUsername(desiredUsername, socket) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var playerExists = findPlayerByUsername(desiredUsername);
	if (!playerExists) {
	   players.push({
			username: desiredUsername,
			socketId: socket.id,
			elo: 1000
		});
	}
	socket.emit("username response", {
		exists: playerExists
	});
}

function sendStats(socket) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	stats = {onlinePlayers: []}
	for (var i = 0; i < players.length; i++) {
		stats.onlinePlayers.push(players[i].username);
	}
	socket.emit("stats", stats);
}

function enterQueue(socket) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	
}

function func(args) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	
}