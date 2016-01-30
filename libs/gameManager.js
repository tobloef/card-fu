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
			debug(queue);
			playerDisconnected(socket);
			debug(queue);
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
			currentCard: undefined,
			points: {
				fire: [],
				ice: [],
				water: []
			}
		}
		dealInitialCards(playerObject);
		match.players.push(playerObject);
		usernames.push(participents[i].username);
		participents[i].socket.emit("initial hand", playerObject.cards);
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

function findMatchBySocketId(socketId, returnUser) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < matches.length; i++) {
		for (var j = 0; j < matches[i].players.length; j++) {
			if (matches[i].players[j].socket.id === socketId) {
				if (returnUser) {
					return [matches[i], matches[i].players[j]];
				} else {
					return matches[i];
				}
			}
		}
	}
}

function playCard(socket, index) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var result = findMatchBySocketId(socket.id, true);
	var match = result[0];
	var player = result[1];
	player.currentCard = player.cards[index];
	player.cards[index] = undefined;
	for (var i = 0; i < match.players.length; i++) {
		if (match.players[i].socket.id !== player.socket.id) {
			match.players[i].socket.emit("unknown card played", player.username);
		}
	}
	if (currentCardsReady(match)) {
		fightCards(match);
	}
}

function currentCardsReady(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < match.players.length; i++) {
		if (match.players[i].currentCard === undefined) {
			return false;
		}
	}
	return true;
}

//This function is hell, make it better
function fightCards(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var player1 = match.players[0];
	var player2 = match.players[1];

	if (player1.currentCard.type === "fire") {
		if (player2.currentCard.type === "fire") {
			if (player1.currentCard.number > player2.currentCard.number) {
				processResults(match, false, player1, player1);
			} else if (player1.currentCard.number < player2.currentCard.number) {
				processResults(match, false, player2, player1);
			} else {
				processResults(match, true, player2, player1);
			}
		} else if (player2.currentCard.type === "ice") {
			processResults(match, false, player1, player2);
		} else if (player2.currentCard.type === "water") {
			processResults(match, false, player2, player1);
		}
	} else if (player1.currentCard.type === "ice") {
		if (player2.currentCard.type === "fire") {
			processResults(match, false, player2, player1);
		} else if (player2.currentCard.type === "ice") {
			if (player1.currentCard.number > player2.currentCard.number) {
				processResults(match, false, player1, player1);
			} else if (player1.currentCard.number < player2.currentCard.number) {
				processResults(match, false, player2, player1);
			} else {
				processResults(match, true, player2, player1);
			}
		} else if (player2.currentCard.type === "water") {
			processResults(match, false, player1, player2);
		}
	} else if (player1.currentCard.type === "water") {
		if (player2.currentCard.type === "fire") {
			processResults(match, false, player1, player2);
		} else if (player2.currentCard.type === "ice") {
			processResults(match, false, player2, player1);
		} else if (player2.currentCard.type === "water") {
			if (player1.currentCard.number > player2.currentCard.number) {
				processResults(match, false, player1, player1);
			} else if (player1.currentCard.number < player2.currentCard.number) {
				processResults(match, false, player2, player1);
			} else {
				processResults(match, true, player2, player1);
			}
		}
	}
}

//winner and loser parameter names only applicable is not tied.
function processResults(match, tied, winner, loser) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	if (!tied) {
		winner.points[winner.currentCard.type].push(winner.currentCard);
	}
	io.to(match.matchId).emit("fight result", {
		tied: tied,
		winner: {
			username: winner.username,
			card: winner.currentCard,
			points: winner.points
		},
		loser: {
			username: loser.username,
			card: loser.currentCard,
			points: loser.points
		}
	});
	newTurn(match);
}

function checkPoints(player) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	
}

function newTurn(match) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}

function func(args) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}