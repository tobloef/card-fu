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
	debug("%s()", arguments.callee.name);
	var index = players.indexOf(findPlayerById(socket.id));
	if (index > -1) {
		players.splice(index, 1);
	}
	leaveQueue(socket);
	leaveMatch(socket);
	sendStats();
}

function findPlayerByUsername(username) {
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].username === username) {
			return players[i];
		}
	}
	return false;
}

function findPlayerById(socketId) {
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
			return players[i];
		}
	}
	return false;
}

function playerExists(username) {
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].username.toLowerCase() === username.toLowerCase()) {
			return true;
		}
	}
	return false;
}

function usernameIsValid(username) {
	debug("%s()", arguments.callee.name);
	return /^[a-zA-Z0-9()]+$/.test(username);
}

function processUsername(socket, desiredUsername) {
	debug("%s()", arguments.callee.name);
	var doesExist = playerExists(desiredUsername);
	var isValid = usernameIsValid(desiredUsername);
	if (!doesExist && isValid) {
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
		exists: (doesExist || !isValid),
		username: desiredUsername
	});
}

function sendStats() {
	debug("%s()", arguments.callee.name);
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
	debug("%s()", arguments.callee.name);
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
	debug("%s()", arguments.callee.name);
	var index = queue.indexOf(findPlayerById(socket.id));
	if (index > -1) {
		queue.splice(index, 1);
	}
	socket.emit("queue left");
}

function createMatch(participents) {
	debug("%s()", arguments.callee.name);
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
	debug("%s()", arguments.callee.name);
	var id = "";
	var charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
	for (var i = 0; i < 16; i++) {
		id += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return id;
}

function dealInitialCards(playerObject) {
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < 5; i++) {
		playerObject.cards[i] = drawCard(playerObject.deck);
	}
}

function drawCard(deck) {
	debug("%s()", arguments.callee.name);
	return deck.shift();
}

function shuffleDeck(deck) {
	debug("%s()", arguments.callee.name);
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
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < matches.length; i++) {
		for (var j = 0; j < matches[i].players.length; j++) {
			if (matches[i].players[j].socket.id === socketId) {
				return matches[i];
			}
		}
	}
}

function playCard(socket, index) {
	debug("%s()", arguments.callee.name);
	var match = findMatchBySocketId(socket.id);
	if (match) {
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
}

function curCardsReady(match) {
	debug("%s()", arguments.callee.name);
	return (match.players[0].curCard && match.players[1].curCard);
}

//This function is hell, make it better
function fightCards(match) {
	debug("%s()", arguments.callee.name);
	var p1 = match.players[0];
	var p2 = match.players[1];

	if (p1.curCard.type === "fire") {
		if (p2.curCard.type === "fire") {
			if (p1.curCard.number > p2.curCard.number) {
				processRound(match, false, p1);
			} else if (p1.curCard.number < p2.curCard.number) {
				processRound(match, false, p2);
			} else {
				processRound(match, true, p1);
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
				processRound(match, true, p1);
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
				processRound(match, true, p1);
			}
		}
	}
}

//winner and loser parameter names only applicable is not tied.
function processRound(match, tied, winner) {
	debug("%s()", arguments.callee.name);
	var loser = match.players[match.players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[types.indexOf(winner.curCard.type)].push(winner.curCard);
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
	} else {
		nextRound(match);
	}
}

function nextRound(match) {
	debug("%s()", arguments.callee.name);
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
	debug("%s()", arguments.callee.name);
	for (var i = 0; i < player.points.length; i++) {
		if (player.points[i].length === 3) {
			return player.points[i];
		}
	}
	for (var i = 0; i < player.points[0].length; i++) {
		for (var j = 0; j < player.points[1].length; j++) {
			for (var k = 0; k < player.points[2].length; k++) {
				if (player.points[0][i].color !== player.points[1][j].color &&
					player.points[0][i].color !== player.points[2][k].color &&
					player.points[1][j].color !== player.points[2][k].color) {
					return [player.points[0][i], player.points[1][j], player.points[2][k]];
				}
			}
		}
	}
	return false;
}

function leaveMatch(socket) {
	debug("%s()", arguments.callee.name);
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var winner = match.players[match.players[0].id !== socket.id ? 0 : 1];
		var loser = match.players[match.players[0].id === socket.id ? 0 : 1];
		endMatch(match, winner, loser, "player left");
	}
}

function endMatch(match, winner, loser, reason) {
	debug("%s()", arguments.callee.name);
	io.to(match.matchId).emit("end match", winner.username, loser.username, reason);
	updateElo(winner, loser);
	var index = matches.indexOf(match);
	if (index > -1) {
		matches.splice(index, 1);
	}
}

function updateElo(winner, loser) {
	debug("%s()", arguments.callee.name);
	winner = findPlayerById(winner.socket.id);
	loser = findPlayerById(loser.socket.id);
	winner.elo += calculateEloGained(winner, loser, 1);
	loser.elo += calculateEloGained(loser, winner, 0);
	sendPlayerInfo(winner.socket);
	sendPlayerInfo(loser.socket);
}

function calculateEloGained(player, opponent, outcome) {
	debug("%s()", arguments.callee.name);
	difference = opponent.elo - player.elo;
	winChance = 1/(1 + Math.pow(10, difference/400));
	eloGained = 32 * (outcome - winChance);
	return eloGained;
}

function func(args) {
	debug("%s()", arguments.callee.name);

}