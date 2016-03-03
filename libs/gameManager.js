var socketio = require("socket.io");

var players = [];
var queue = [];
var matches = [];

var types = ["fire", "water", "ice"];
var powers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];

var logFull = false;

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

		socket.on("get player info", function() {
			sendPlayerInfo(socket);
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
	});
	return io;
};


//////////  Methods  \\\\\\\\\\
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
		status: 0,
		modifier: 0,
		timer: undefined
	};
	for (var i = 0; i < participants.length; i++) {
		var playerObject = {
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
		participants[i].socket.emit("update cards", playerObject.cards);
		participants[i].socket.join(id);
	}
	matches.push(match);
	io.to(id).emit("enter match");
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
				}
			}
		}
	}
}

function curCardsReady(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var isReady = (match.players[0].curCard && match.players[1].curCard)
	return isReady;
}

//This function should probably be shorter
function fightCards(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var p1 = match.players[0];
	var p2 = match.players[1];

	if (p1.curCard.type === "fire") {
		if (p2.curCard.type === "fire") {
			if (p1.curCard.power > p2.curCard.power) {
				processRound(match, false, p1);
			} else if (p1.curCard.power < p2.curCard.power) {
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
			if (p1.curCard.power > p2.curCard.power) {
				processRound(match, false, p1);
			} else if (p1.curCard.power < p2.curCard.power) {
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
			if (p1.curCard.power > p2.curCard.power) {
				processRound(match, false, p1);
			} else if (p1.curCard.power < p2.curCard.power) {
				processRound(match, false, p2);
			} else {
				processRound(match, true, p1);
			}
		}
	}
}

//winner and loser parameter names only applicable is not tied.
function processRound(match, tied, winner) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var loser = match.players[match.players[0] !== winner ? 0 : 1];
	if (!tied) {
		winner.points[types.indexOf(winner.curCard.type)].push(winner.curCard);
	}
	io.to(match.matchId).emit("fight result", {
		tied: tied,
		winner: {
			socketId: winner.socket.id,
			card: winner.curCard,
			points: winner.points
		},
		loser: {
			socketId: loser.socket.id,
			card: loser.curCard,
			points: loser.points
		}
	});
	if (checkForSet(winner)) {
		endMatch(match, winner, loser, "set");
	} else {
		nextRound(match);
	}
}

function nextRound(match) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < match.players.length; i++) {
		match.players[i].curCard = undefined;
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
				// If the player has 3 different elements with same color
				else if
				   (player.points[0][i].color === player.points[1][j].color &&
					player.points[0][i].color === player.points[2][k].color &&
					player.points[1][j].color === player.points[2][k].color) {
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
		var winner = match.players[match.players[0].socket.id !== socket.id ? 0 : 1];
		var loser = match.players[match.players[0].socket.id === socket.id ? 0 : 1];
		endMatch(match, winner, loser, "player left");
	}
}

function endMatch(match, winner, loser, reason) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	io.to(match.matchId).emit("end match", winner.socket.id, loser.socket.id, reason);
	var index = matches.indexOf(match);
	if (index > -1) {
		matches.splice(index, 1);
	}
}

function generateDeck() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var c = Math.floor(Math.random() * (6));
	deck = [];
	for (var t = 0; t < types.length; t++) {
		for (var n = 1; n < powers.length; n++) {
			deck.push({
				type: types[t],
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
		var player = match.players[match.players[0].socket.id === socket.id ? 0 : 1]
		player.socket.emit("update cards", player.cards);
	}
}