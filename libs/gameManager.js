var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");

var players = []

//////////  Socket.io  \\\\\\\\\\
module.exports.listen = function(app) {
    io = socketio.listen(app);
    io.on("connection", function(socket) {

        socket.on("username submit", function(desiredUsername) {
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
        });

        socket.on("enter queue", function() {

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

function func(args) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	
}