var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");

var players = [];
var queue = [];
var matches = [];

types = ["fire", "water", "ice"];
numbers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];

defaultDeck = [];
for (var t = 0; t < types.length; t++) {
    for (var n = 1; n < numbers.length; n++) {
        defaultDeck.push({
            type: types[t],
            number: numbers[n]
        });
    }
}


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

        socket.on("get user stats", function(socket) {
            sendUserStats(socket);
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

function playerExists(username) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    for (var i = 0; i < players.length; i++) {
        if (players[i].username.toLowerCase() === username.toLowerCase()) {
           return true;
        }
    }
    return false;
}

function processUsername(desiredUsername, socket) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    var playerExists = playerExists(desiredUsername);
    if (!playerExists) {
        players.push({
            username: desiredUsername,
            socketId: socket.id,
            elo: 1000,
            deck: defaultDeck
        });
        sendGlobalStats();
    }
    socket.emit("username response", {
        exists: playerExists
    });
}

function sendGlobalStats() {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    stats = {
        onlinePlayers: []
    }
    for (var i = 0; i < players.length; i++) {
        stats.onlinePlayers.push(players[i].username);
    }
    io.emit("global stats", stats);
}

function sendUserStats(socket) {
    //Do something
}


function enterQueue(socket) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    var player = findPlayerById(socket.id);
    if (queue.indexOf(player) === -1) {
	    queue.push(player);
	    socket.emit("queue response");
	    if (queue.length >= 2) {
	        createMatch([queue.shift(), queue.shift()]);
	    }
	}
}

function createMatch(participents) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    usernames = [];
    var roomId = createId();
    matches[roomId] = {
        players: [],
        status: 0,
        modifier: 0,
        timer: undefined
    };
    for (var i = 0; i < participents.length; i++) {
        matches[roomId].players.push({
            username: participents[i].username,
            socketId: participents[i].socketId,
            elo: participents[i].elo,
            deck: participents[i].deck,
            cards: [],
            points: []
        });
        usernames.push(participents[i].username);
        io.sockets.connected[participents[i].socketId].join(roomId);
    }
    io.to(roomId).emit("enter match", usernames);
    //Do something
}

function createId() {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    var id = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
    for (var i = 0; i < 16; i++) {
        id += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return id;
}

function func(args) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}