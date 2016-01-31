var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");

var players = [];
var queue = [];
var matches = [];

types = ["fire", "water", "ice"];
numbers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
colors = ["yellow", "orange", "green", "blue", "red", "purple"];
c = 0;

defaultDeck = [];
for (var t = 0; t < types.length; t++) {
	for (var n = 1; n < numbers.length; n++) {
		defaultDeck.push({
			type: types[t],
			number: numbers[n],
			color: colors[c++%6]
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
			processUsername(socket, desiredUsername);
		});

		socket.on("enter queue", function() {
			enterQueue(socket);
		});

		socket.on("leave queue", function() {
			leaveQueue(socket);
		});

		socket.on("get player info", function() {
			sendPlayerInfo(socket);
		});

		socket.on("play card", function(index) {
			playCard(socket, index);
		});

		socket.on("leave match", function() {
			leaveMatch(socket);
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
	leaveMatch(socket);
	sendStats();
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

function findPlayerById(socketId) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
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

function processUsername(socket, desiredUsername) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var doesExist = playerExists(desiredUsername);
	if (!doesExist) {
		players.push({
			username: desiredUsername,
			socket: socket,
			elo: 1000,
			deck: defaultDeck
		});
		sendStats();
		sendPlayerInfo(socket);
	}
	socket.emit("username response", {
		exists: doesExist,
		username: desiredUsername
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
	io.emit("stats", stats);
}

function sendPlayerInfo(socket) {
	var player = findPlayerById(socket.id);
	info = {
		username: player.username,
		elo: player.elo
	};
	socket.emit("player info", info);
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
	var id = createId();
	match = {
		matchId: id,
		players: [],
		status: 0,
		modifier: 0,
		timer: undefined
	};
	for (var i = 0; i < participents.length; i++) {
		var playerObject = {
			username: participents[i].username,
			socket: participents[i].socket,
			elo: participents[i].elo,
			deck: shuffleDeck(participents[i].deck),
			cards: [],
			curCard: undefined,
			points: {
				fire: [],
				ice: [],
				water: []
			}
		}
		dealInitialCards(playerObject);
		match.players.push(playerObject);
		usernames.push(participents[i].username);
		participents[i].socket.emit("update cards", playerObject.cards);
		participents[i].socket.join(id);
	}
	matches.push(match);
	io.to(id).emit("enter match", usernames);
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
	return deck.shift();
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

function findMatchBySocketId(socketId) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < matches.length; i++) {
		for (var j = 0; j < matches[i].players.length; j++) {
			if (matches[i].players[j].socket.id === socketId) {
				return matches[i];
			}
		}
	}
}

function playCard(socket, index) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	player = match.players[match.players[0].socket.id === socket.id ? 0 : 1]
	if (!player.curCard) {
		player.curCard = player.cards[index];
		player.cards[index] = undefined;
		opponent = match.players[match.players[0].socket.id !== socket.id ? 0 : 1]
		if (curCardsReady(match)) {
			fightCards(match);
		}
	}
}

function curCardsReady(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	return (match.players[0].curCard && match.players[1].curCard);
}

//This function is hell, make it better
function fightCards(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var p1 = match.players[0];
	var p2 = match.players[1];

	if (p1.curCard.type === "fire") {
		if (p2.curCard.type === "fire") {
			if (p1.curCard.number > p2.curCard.number) {
				processRound(match, false, p1);
			} else if (p1.curCard.number < p2.curCard.number) {
				processRound(match, false, p2);
			} else {
				processRound(match, true);
			}
		} else if (p2.curCard.type === "ice") {
			processRound(match, false, p1);
		} else if (p2.curCard.type === "water") {
			processRound(match, false, p2);
		}
	} else if (p1.curCard.type === "ice") {
		if (p2.curCard.type === "fire") {
			processRound(match, false, p2);
		} else if (p2.curCard.type === "ice") {
			if (p1.curCard.number > p2.curCard.number) {
				processRound(match, false, p1);
			} else if (p1.curCard.number < p2.curCard.number) {
				processRound(match, false, p2);
			} else {
				processRound(match, true);
			}
		} else if (p2.curCard.type === "water") {
			processRound(match, false, p1);
		}
	} else if (p1.curCard.type === "water") {
		if (p2.curCard.type === "fire") {
			processRound(match, false, p1);
		} else if (p2.curCard.type === "ice") {
			processRound(match, false, p2);
		} else if (p2.curCard.type === "water") {
			if (p1.curCard.number > p2.curCard.number) {
				processRound(match, false, p1);
			} else if (p1.curCard.number < p2.curCard.number) {
				processRound(match, false, p2);
			} else {
				processRound(match, true);
			}
		}
	}
}

//winner and loser parameter names only applicable is not tied.
function processRound(match, tied, winner) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	loser = match.players[players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[winner.curCard.type].push(winner.curCard.color);
	}
	io.to(match.matchId).emit("fight result", {
		tied: tied,
		winner: {
			username: winner.username,
			card: winner.curCard,
			points: winner.points
		},
		loser: {
			username: loser.username,
			card: loser.curCard,
			points: loser.points
		}
	});
	var setStatus = checkForSet(winner);
	if (setStatus.hasWon) {
		endMatch(match, winner, setStatus.set);
	}
}

function nextRound(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < match.players.length; i++) {
		match.players[i].curCard = undefined;
		for (var j = 0; j < match.players[i].cards.length; j++) {
			if (match.players[i].cards[j] === undefined) {
				match.players[i].cards[j] = drawCard(match.players[i].deck);
			}
		}
		match.players[i].socket.emit("update cards", match.players[i].cards);
	}
}

function checkForSet(player) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	
}

function leaveMatch(socket) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}

function endMatch(match, winner, loser, reason) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}


function func(args) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}