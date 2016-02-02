var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");

var players = [];
var queue = [];
var matches = [];

var types = ["fire", "water", "ice"];
var numbers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];
var c = 0;

defaultDeck = [];
for (var t = 0; t < types.length; t++) {
	for (var n = 1; n < numbers.length; n++) {
		defaultDeck.push({
			type: types[t],
			number: numbers[n],
			color: colors[c++ % 6]
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
	var stats = {
		onlinePlayers: []
	};
	for (var i = 0; i < players.length; i++) {
		stats.onlinePlayers.push(players[i].username);
	}
	io.emit("stats", stats);
}

function sendPlayerInfo(socket) {
	var player = findPlayerById(socket.id);
	var info = {
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
	var usernames = [];
	var id = createId();
	var match = {
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
			deck: shuffleDeck(participents[i].deck),
			cards: [],
			curCard: undefined,
			points: [
				[],
				[],
				[]
			]
		};
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
	var deckCopy = deck.slice();
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
	var player = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
	if (!player.curCard) {
		player.curCard = player.cards[index];
		player.cards[index] = undefined;
		var opponent = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
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
	var loser = match.players[players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[types.indexOf(winner.curCard.type)].push(winner.curCard.color);
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
	var set = checkForSet(winner);
	if (set) {
		endMatch(match, winner, loser, set);
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
	for (var i = 0; i < player.points.length; i++) {
		if (player.points[i].length === 3) {
			return player.points[i];
		}
	}
	for (var i = 0; i < type[0].colors.length; i++) {
		for (var j = 0; j < type[1].colors.length; j++) {
			for (var k = 0; k < type[2].colors.length; k++) {
				if (type[0].colors[i] !== type[1].colors[j] &&
					type[0].colors[i] !== type[2].colors[k] &&
					type[1].colors[j] !== type[2].colors[k]) {
					return [type[0].colors[i], type[1].colors[j], type[2].colors[k]];
				}
			}
		}
	}
	return false;
}

function leaveMatch(socket) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var winner = match.players[match.players[0].id === socket.id ? 0 : 1];
		var loser = match.players[match.players[0].id !== socket.id ? 0 : 1];
		endMatch(match, winner, loser, "player left");
	}
}

function endMatch(match, winner, loser, reason) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	io.to(match.matchId).emit("end match", reason);
	updateElo(winner, loser);
	var index = matches.indexOf(match);
	if (index > -1) {
		matches.splice(index, 1);
	}
}

function updateElo(winner, loser) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	winner = findPlayerById(winner.socket.id);
	loser = findPlayerById(loser.socket.id);
	winner.elo += calculateNewElo(winner, loser, 1);
	loser.elo += calculateNewElo(loser, winner, 0);
	sendPlayerInfo(winner.socket);
	sendPlayerInfo(loser.socket);
}

function calculateEloGained(player, opponent, outcome) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	difference = opponent.elo - player.elo;
	winChance = 1/(1 + Math.pow(10, difference/400));
	eloGained = 32 * (outcome - winChance);
	return eloGained;
}

function func(args) {
	debug("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());

}