// This file handles all socket.io connections and manages the serverside game logic.

var socketio = require("socket.io");

var players = [];
var queue = [];
var matches = [];
var rematchRequests = [];

var powers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];

var logFull = false;
var timerDuration = 22;

updateTimers();

//////////  Socket.io  \\\\\\\\\\
module.exports.listen = function(app) {
	io = socketio.listen(app);
	io.on("connection", function(socket) {
		players.push({
			socket: socket,
			deck: undefined
		});

		socket.on("disconnect", function() {
			playerDisconnected(socket);
		});

		socket.on("enter queue", function() {
			enterQueue(socket);
		});

		socket.on("leave queue", function() {
			leaveQueue(socket);
		});

		socket.on("play card", function(index) {
			playCard(socket, index);
		});

		socket.on("leave match", function() {
			leaveMatch(socket);
		});

		socket.on("request cards update", function() {
			updateCardsRequested(socket);
		});

		socket.on("request rematch", function() {
			rematchRequested(socket);
		});
	});
	return io;
};

//////////  Functions  \\\\\\\\\\
function playerDisconnected(socket) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var player = findPlayerById(socket.id);
	var index = players.indexOf(player);
	if (index > -1) {
		leaveQueue(socket);
		leaveMatch(socket);
		players.splice(index, 1);
	}
}

function findPlayerById(socketId) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < players.length; i++) {
		if (players[i].socket.id === socketId) {
			return players[i];
		}
	}
	return false;
}

function enterQueue(socket) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
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
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var player = findPlayerById(socket.id);
	var index = queue.indexOf(player);
	if (index > -1) {
		queue.splice(index, 1);
	}
	socket.emit("queue left");
}

function createMatch(participants) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var id = createId();
	var match = {
		matchId: id,
		players: [],
		isOver: false,
		timerActive: false,
		timer: timerDuration
	};
	for (var i = 0; i < participants.length; i++) {
		var playerObject = {
			socket: participants[i].socket,
			deck: shuffleDeck(generateDeck()),
			cards: [],
			cur: undefined,
			points: [
				[],
				[],
				[]
			]
		};
		dealInitialCards(playerObject);
		match.players.push(playerObject);
		participants[i].socket.emit("update cards", playerObject.cards);
		participants[i].socket.join(id);
	}
	matches.push(match);
	io.to(id).emit("enter match");
	match.timerActive = true;
}

function createId() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var id = "";
	var charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
	for (var i = 0; i < 16; i++) {
		id += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return id;
}

function dealInitialCards(playerObject) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < 5; i++) {
		playerObject.cards[i] = drawCard(playerObject.deck);
	}
}

function drawCard(deck) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	return deck.shift();
}

function shuffleDeck(deck) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
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
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < matches.length; i++) {
		for (var j = 0; j < matches[i].players.length; j++) {
			if (matches[i].players[j].socket.id === socketId) {
				return matches[i];
			}
		}
	}
	return false;
}

function playCard(socket, index) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var player = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
		if (!player.cur) {
			if (index >= 0 && index <= 4) {
				if (player.cards[index] !== undefined) {
					player.cur = player.cards[index];
					player.cards[index] = undefined;
					var opponent = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
					opponent.socket.emit("unknown card played");
					if (cursReady(match)) {
						match.timerActive = false;
						match.timer = timerDuration;
						fightCards(match);
					}
				}
			}
		}
	}
}

function cursReady(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var isReady = (match.players[0].cur && match.players[1].cur);
	return isReady;
}

function fightCards(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	c0 = match.players[0].cur;
	c1 = match.players[1].cur;
	if (c0.type === c1.type) {
		// If the the powers are equal, it's a tie. Pass the player with the higest power as winner.
		processRound(match, c0.power === c1.power, match.players[c0.power > c1.power ? 0 : 1]);
	} else {
		// Using modulus we can find the player with the winning type.
		// Our types are represented by numbers: Rock = 0, Paper = 1, Scissors = 2
		// We don't have to worry about ties, so a table of outcomes would look like this:

		// | Types  _0_|_1_|_2_|
		// |   0   |   | 1 | 0 |
		// |   1   | 0 |   | 1 |
		// |   2   | 1 | 0 |   |

		// Since we have an array of players, we can use the outcome as the index to get the winner.
		processRound(match, false, match.players[(2 + c0.type - c1.type) % 3]);
	}
}
function processRound(match, tied, winner) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var loser = match.players[match.players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[winner.cur.type].push(winner.cur);
	}
	var data = {
		tied: tied,
		winner: {
			socketId: winner.socket.id,
			card: winner.cur,
			points: winner.points
		},
		loser: {
			socketId: loser.socket.id,
			card: loser.cur,
			points: loser.points
		}
	};
	io.to(match.matchId).emit("fight result", data);
	if (checkForSet(winner)) {
		endMatch(match, winner, "set");
	} else {
		nextRound(match);
	}
}

function nextRound(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < match.players.length; i++) {
		match.players[i].cur = undefined;
		for (var j = 0; j < match.players[i].cards.length; j++) {
			if (match.players[i].cards[j] === undefined) {
				match.players[i].cards[j] = drawCard(match.players[i].deck);
			}
		}
	}
}

function checkForSet(player) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < player.points.length; i++) {
		var setColors = [];
		for (var j = 0; j < player.points[i].length; j++) {
			if (setColors.indexOf(player.points[i][j].color) === -1) {
				setColors.push(player.points[i][j].color);
			}
		}
		// If the player has 3 of the same element of different color
		if (setColors.length >= 3) {
			return true;
		}
	}
	for (var i = 0; i < player.points[0].length; i++) {
		for (var j = 0; j < player.points[1].length; j++) {
			for (var k = 0; k < player.points[2].length; k++) {
				
				// If player has 3 different elements with 3 different colors
				if (player.points[0][i].color !== player.points[1][j].color &&
					player.points[0][i].color !== player.points[2][k].color &&
					player.points[1][j].color !== player.points[2][k].color) {
					return true;
				}
			}
		}
	}
	return false;
}

function leaveMatch(socket) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	if (match) {
		if (!match.isOver) {
			var winner = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
			endMatch(match, winner, "player left");
		} else {
			io.to(match.matchId).emit("no rematch");
		}
		removeMatch(match);
	}
}

function endMatch(match, winner, reason) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	io.to(match.matchId).emit("end match", winner.socket.id, reason);
	match.isOver = true;
	match.timer = timerDuration;
	match.timerActive = false;
}

function removeMatch(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var index = matches.indexOf(match);
	if (index > -1) {
		matches.splice(index, 1);
	}
}

function generateDeck() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var c = Math.floor(Math.random() * (6));
	deck = [];
	for (var t = 0; t < 3; t++) {
		for (var n = 1; n < powers.length; n++) {
			deck.push({
				type: t,
				power: powers[n],
				color: colors[c++ % 6]
			});
		}
	}
	return deck;
}

function updateCardsRequested(socket) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var player = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
		player.socket.emit("update cards", player.cards);
		match.timerActive = true;
	}
}

function rematchRequested(socket) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var match = findMatchBySocketId(socket.id);
	if (match) {
		var players = match.players;
		if (match.rematch !== undefined && match.rematch !== socket.id) {
			removeMatch(match);
			createMatch(players);
		} else {
			match.rematch = socket.id;
		}
	}
} 

function updateTimers() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < matches.length; i++) {
		if (matches[i].timerActive) {
			matches[i].timer -= 1;
			if (matches[i].timer === 0) {
				timesup(matches[i]);
			}
		}
	}
	setTimeout(updateTimers, 1000);
}

function timesup(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	match.timerActive = false;
	match.timer = timerDuration;
	if (match.players[0].cur) {
		if (match.players[1].cur) {
			fightCards(match);
		} else {
			processRound(match, false, match.players[0]);
		}
	} else {
		if (match.players[1].cur) {
			processRound(match, false, match.players[1]);
		} else {
			processRound(match, true, match.players[0]);
		}
	}
}
