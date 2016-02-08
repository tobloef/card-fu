var debug = require("debug")("game");
var socketio = require("socket.io");
var dbm = require("../libs/databaseManager");

var players = [];
var queue = [];
var matches = [];

var types = ["fire", "water", "ice"];
var numbers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];

var logFunctions = true;
var logFriendly = true;


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
	if (logFunctions) debug("%s()", arguments.callee.name);
	var player = findPlayerById(socket.id);
	var index = players.indexOf(player);
	if (index > -1) {
		if (logFriendly) debug("Player %s got disconnected.", player.username);
		players.splice(index, 1);
		leaveQueue(socket);
		leaveMatch(socket);
	} else {
		if (logFriendly) debug("Player tried to disconnect but wasn't even on player list.");
	}
	sendStats();
}

function findPlayerByUsername(username) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].username === username) {
			if (logFriendly) debug("Found player with username %s.", username);
			return players[i];
		}
	}
	if (logFriendly) debug("Did not find player with username %s.", username);
	return false;
}

function findPlayerById(socketId) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
			if (logFriendly) debug("Found player with id %s.", socketId);
			return players[i];
		}
	}
	if (logFriendly) debug("Did not find player with id %s.", socketId);
	return false;
}

function playerExists(username) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	for (var i = 0; i < players.length; i++) {
		if (players[i].username.toLowerCase() === username.toLowerCase()) {
			if (logFriendly) debug("Player with username %s does exists.", username);
			return true;
		}
	}
	if (logFriendly) debug("Player with username %s does not exists.", username);
	return false;
}

function usernameIsValid(username) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var isValid = !(username === undefined || username === null) && /^[a-z0-9_]{3,16}$/i.test(username);
	if (logFriendly) debug("The username %s is %svalid.", username, (isValid) ? "" : "not ");
	return isValid;
}

function processUsername(socket, desiredUsername) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	if (usernameIsValid(desiredUsername)) {
		if (!playerExists(desiredUsername)) {
			if (logFriendly) debug("Adding player %s to player list.", desiredUsername);
			players.push({
				username: desiredUsername,
				socket: socket,
				elo: 1000,
				deck: undefined
			});
			socket.emit("username response", {
				success: true,
				username: desiredUsername
			});
			sendStats();
			sendPlayerInfo(socket);
		}
	} else {
		socket.emit("username response", {
			success: false,
		});
	}
}

function sendStats() {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var stats = {
		onlinePlayers: []
	};
	for (var i = 0; i < players.length; i++) {
		stats.onlinePlayers.push(players[i].username);
	}
	if (logFriendly) debug("Sending stats to all players.");
	io.emit("stats", stats);
}

function sendPlayerInfo(socket) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var player = findPlayerById(socket.id);
	var info = {
		username: player.username,
		elo: player.elo
	};
	if (logFriendly) debug("Sending their player info to player %s.", player.username);
	socket.emit("player info", info);
}


function enterQueue(socket) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var player = findPlayerById(socket.id);
	if (queue.indexOf(player) === -1) {
		queue.push(player);
		if (logFriendly) debug("Added player %s to the queue.", player.username);
		socket.emit("queue entered");
		if (queue.length >= 2) {
			if (logFriendly) debug("More than two players are in the queue, should create a match.");
			createMatch([queue.shift(), queue.shift()]);
		}
	} else {
		if (logFriendly) debug("Player %s tried to enter the queue, but is already in it.", player.username);
	}
}

function leaveQueue(socket) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var player = findPlayerById(socket.id);
	var index = queue.indexOf(player);
	if (index > -1) {
		if (logFriendly) debug("Removing player s% from the queue.", player.username);
		queue.splice(index, 1);
	} else {
		if (logFriendly) debug("Player %s tried to leave the queue, but wasn't in it.", player.username);
	}
	socket.emit("queue left");
}

function createMatch(participants) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var usernames = [];
	var id = createId();
	if (logFriendly) debug("Creating match with id %s.", id);
	var match = {
		matchId: id,
		players: [],
		status: 0,
		modifier: 0,
		timer: undefined
	};
	for (var i = 0; i < participants.length; i++) {
		if (logFriendly) debug("Adding player %s to match with id %s.", participants[i].username, id);
		var playerObject = {
			username: participants[i].username,
			socket: participants[i].socket,
			deck: shuffleDeck(generateDeck()),
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
		usernames.push(participants[i].username);
		participants[i].socket.emit("update cards", playerObject.cards);
		participants[i].socket.join(id);
	}
	matches.push(match);
	io.to(id).emit("enter match", usernames);
}

function createId() {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var id = "";
	var charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
	for (var i = 0; i < 16; i++) {
		id += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	if (logFriendly) debug("Generated id %s.", id);
	return id;
}

function dealInitialCards(playerObject) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	for (var i = 0; i < 5; i++) {
		playerObject.cards[i] = drawCard(playerObject.deck);
		if (logFriendly) debug("Gave player %s a %s.", playerObject.username, JSON.stringify(playerObject.cards[i]));
	}
}

function drawCard(deck) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	return deck.shift();
}

function shuffleDeck(deck) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var deckCopy = deck.slice();
	for (var i = deckCopy.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = deckCopy[i];
		deckCopy[i] = deckCopy[j];
		deckCopy[j] = temp;
	}
	if (logFriendly) debug("Shuffled a deck.");
	return deckCopy;
}

function findMatchBySocketId(socketId) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	for (var i = 0; i < matches.length; i++) {
		for (var j = 0; j < matches[i].players.length; j++) {
			if (matches[i].players[j].socket.id === socketId) {
				if (logFriendly) debug("Found match with player %s with id %s in it.", players[j].username, socketId);
				return matches[i];
			}
		}
	}
	if (logFriendly) debug("Didn't find match with player with id %s in it.", socketId);
	return false;
}

function playCard(socket, index) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var player = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
		if (!player.curCard) {
			if (index >= 0 && index <= 4) {
				if (player.cards[index] !== undefined) {
					player.curCard = player.cards[index];
					player.cards[index] = undefined;
					var opponent = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
					opponent.socket.emit("unknown card played");
					if (curCardsReady(match)) {
						fightCards(match);
					}
				} else {
					if (logFriendly) debug("Player %s tried to play card at position %s, but that slot if empty.", player.username, index);
				}
			} else {
				if (logFriendly) debug("Player %s tried to play card at position %s, which isn't valid.", player.username, index);
			}
		} else {
			if (logFriendly) debug("Player %s tried to play card, but had already played one.", player.username);
		}
	}
}

function curCardsReady(match) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var isReady = (match.players[0].curCard && match.players[1].curCard)
	if (logFriendly && isReady) debug("Both players in match %s have played their cards.", match.matchId);
	return isReady;
}

//This function should probably be shorter
function fightCards(match) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var p1 = match.players[0];
	var p2 = match.players[1];

	if (logFriendly) debug("Player %s played a %s and player %s played a %s."), p1.username, p1.curCard, p2.username, p2.curCard;

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
	if (logFunctions) debug("%s()", arguments.callee.name);
	var loser = match.players[match.players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[types.indexOf(winner.curCard.type)].push(winner.curCard);
		if (logFriendly) debug("The winner of this round was %s. The loser was %s.", winner.username, loser.username);
	} else {
		if (logFriendly) debug("Player %s and %s got tied this round.", winner.username, loser.username);
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
		if (logFriendly) debug("Player %s has full set %s.", winner.username, JSON.stringify(set));
		endMatch(match, winner, loser, set);
	} else {
		if (logFriendly) debug("No sets, going to next round.");
		nextRound(match);
	}
}

function nextRound(match) {
	if (logFunctions) debug("%s()", arguments.callee.name);
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
	if (logFunctions) debug("%s()", arguments.callee.name);
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
	if (logFunctions) debug("%s()", arguments.callee.name);
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var winner = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
		var loser = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
		if (logFriendly) debug("Player %s left the match so player %s wins.", loser.username, winner.username);
		endMatch(match, winner, loser, "player left");
	} else {
		if (logFriendly) debug("Player with id %s tried to leave a match, but isn't in one.", socket.id);
	}
}

function endMatch(match, winner, loser, reason) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	io.to(match.matchId).emit("end match", winner.username, loser.username, reason);
	updateElo(winner, loser);
	var index = matches.indexOf(match);
	if (index > -1) {
		matches.splice(index, 1);
		if (logFriendly) debug("Removes match with id %s from match list.", match.matchId);
	} else {
		if (logFriendly) debug("Tried to remove match with id %s from match list, but it isn't in the list anyway.", match.matchId);
	}
}

function updateElo(winner, loser) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	winner = findPlayerById(winner.socket.id);
	loser = findPlayerById(loser.socket.id);
	winner.elo += calculateEloGained(winner, loser, 1);
	loser.elo += calculateEloGained(loser, winner, 0);
	if (logFriendly) debug("Updated players elo. %s now has %s ELO, while %s now has %s.", winner.username, winner.elo, loser.username, loser.elo);
	sendPlayerInfo(winner.socket);
	sendPlayerInfo(loser.socket);
}

function calculateEloGained(player, opponent, outcome) {
	if (logFunctions) debug("%s()", arguments.callee.name);
	difference = opponent.elo - player.elo;
	winChance = 1/(1 + Math.pow(10, difference/400));
	eloGained = 32 * (outcome - winChance);
	return eloGained;
}

function generateDeck() {
	if (logFunctions) debug("%s()", arguments.callee.name);
	var c = Math.floor(Math.random() * (6));
	deck = [];
	for (var t = 0; t < types.length; t++) {
		for (var n = 1; n < numbers.length; n++) {
			deck.push({
				type: types[t],
				number: numbers[n],
				color: colors[c++ % 6]
			});
		}
	}
	if (logFriendly) debug("Generated deck %s.", JSON.stringify(deck));
	return deck;
}

function func(args) {
	if (logFunctions) debug("%s()", arguments.callee.name);

}