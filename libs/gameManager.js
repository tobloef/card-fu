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

		socket.on("disconnect", function() {
			playerDisconnected(socket);
		});

        socket.on("username submit", function(desiredUsername) {
            processUsername(desiredUsername, socket);
        });

        socket.on("enter queue", function() {
            enterQueue(socket);
        });
        
        socket.on("leave queue", function() {
            leaveQueue(socket);
        });

        socket.on("get user info", function(socket) {
            sendUserInfo(socket);
        });
    });
    return io;
};


//////////  Methods  \\\\\\\\\\
function playerDisconnected(socket) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var index = players.indexOf(findPlayerById(socket.id));
	if (index > -1) {
		players.splice(index, 1);
	}
	leaveQueue(socket);
}

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
    var doesExist = playerExists(desiredUsername);
    if (!doesExist) {
        players.push({
            username: desiredUsername,
            socketId: socket.id,
            elo: 1000,
            deck: defaultDeck
        });
        sendStats();
        sendUserInfo(socket);
    }
    socket.emit("username response", {
        exists: doesExist
    });
}

function sendStats() {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    stats = {
        onlinePlayers: []
    };
    for (var i = 0; i < players.length; i++) {
        stats.onlinePlayers.push(players[i].username);
    }
    io.emit("global stats", stats);
}

function sendUserInfo(socket) {
    var user = findPlayerById(socket.id);
    info = {
    	username: user.username,
    	elo: user.elo
    };
    socket.emit("user info", info);
}


function enterQueue(socket) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    var player = findPlayerById(socket.id);
    if (queue.indexOf(player) === -1) {
        queue.push(player);
        socket.emit("queue entered");
        if (queue.length >= 2) {
            createMatch([queue.shift(), queue.shift()]);
        }
    }
}

function leaveQueue(socket) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var index = queue.indexOf(findPlayerById(socket.id));
	if (index > -1) {
		queue.splice(index, 1);
	}
	socket.emit("queue left");
}

function createMatch(participents) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    usernames = [];
    var matchId = createId();
    matches[matchId] = {
        players: [],
        status: 0,
        modifier: 0,
        timer: undefined
    };
    for (var i = 0; i < participents.length; i++) {
    	var playerObject = {
            username: participents[i].username,
            socketId: participents[i].socketId,
            elo: participents[i].elo,
            deck: shuffleDeck(participents[i].deck),
            cards: [],
            points: []
        }
        var socket = io.sockets.connected[participents[i].socketId]
        dealInitialCards(playerObject);
        matches[matchId].players.push(playerObject);
        usernames.push(participents[i].username);
        socket.emit("initial hand", playerObject.cards);
        socket.join(matchId);
    }
    io.to(matchId).emit("enter match", usernames);
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

function dealInitialCards(playerObject) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    for (var i = 0; i < 5; i++) {
    	playerObject.cards[i] = drawCard(playerObject.deck);
    }
}

function drawCard(deck) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    if (deck.length > 0) {
    	return deck.shift();
	} else {
		return false;
	}
}

function shuffleDeck(deck) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
    deckCopy = deck.slice();
    for (var i = deckCopy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = deckCopy[i];
        deckCopy[i] = deckCopy[j];
        deckCopy[j] = temp;
    }
    return deckCopy;
}

function func(args) {
    debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}