var socket = io();
var canPlayCard = false;
var logFull = true;
var playerPoints = [],
	opponentPoints = [];
var handSlots, opponentCard, playerCard, matchWinner, matchEndReason, readyToEnd;

//////////  Socket Events  \\\\\\\\\\
socket.on("enter match", function() {
	enterMatch();
});

socket.on("update cards", function(cards) {
	updateCards(cards);
});

socket.on("unknown card played", function() {
	unknownCardPlayed();
});

socket.on("fight result", function(result) {
	displayResult(result);
});

socket.on("end match", function(winner, reason) {
	matchWinner = winner;
	matchEndReason = reason;
	readyToEnd = true;
	if (canPlayCard) {
		endMatch();
	}
});

socket.on("no rematch", function() {
	labels["rematch"].disabled = true;
});

//////////  Functions  \\\\\\\\\\
function enterQueue() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	socket.emit("enter queue");
	labels["play"].visible = false;
	labels["play"].clickable = false;
	labels["searching"].visible = true;
}

function enterMatch() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	playerPoints = [];
	opponentPoints = [];
	labels["result"].visible = false;
	labels["main menu"].visible = false;
	labels["main menu"].clickable = false;
	labels["rematch"].visible = false;
	labels["rematch"].clickable = false;
	labels["rematch"].disabled = false;
	labels["searching"].visible = false;
	labels["logo"].visible = false;
	displayCardSlots = true;
}

function updateCards(cards) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < cards.length; i++) {
		handSlots[i].card = cards[i];
	}
	canPlayCard = true;
}

function playCard(index) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	if (canPlayCard) {
		socket.emit("play card", index);
		canPlayCard = false;
	}
}

function unknownCardPlayed() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	opponentCard = {isUnknown: true};
}

function displayResult(result) {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var player = (result.winner.socketId === socket.id) ? result.winner : result.loser;
	var opponent = (result.winner.socketId !== socket.id) ? result.winner : result.loser;
	playerPoints = player.points;
	opponentPoints = opponent.points;
	opponentCard = opponent.card;
	setTimeout(function() {
		if (readyToEnd) {
			endMatch();
		} else {
			canPlayCard = true;
			opponentCard = undefined;
			playerCard = undefined;
			socket.emit("request cards update");
		}
	}, (2 * 1000));
}

function endMatch() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	canPlayCard = false;
	readyToEnd = false;
	opponentCard = undefined;
	playerCard = undefined;
	displayCardSlots = false;
	for (var i = 0; i < handSlots.length; i++) {
		handSlots[i].card = undefined;
	}

	if (matchEndReason === "player left") {
		var reason = ["Your opponent", "You"][+(socket.id !== matchWinner)] + " left the match";
		labels["rematch"].disabled = true;
		labels["rematch"].clickable = false;
	} else {
		var reason = ["Your opponent has", "You have"][+(socket.id === matchWinner)] + " a full set";
		labels["rematch"].clickable = true;
	}

	labels["result"].text = ["You Lose!", "You Win!"][+(socket.id === matchWinner)];
	labels["result"].visible = true;
	labels["rematch"].visible = true;
	labels["main menu"].visible = true;
	labels["main menu"].clickable = true;
	matchWinner = undefined;
	matchEndReason = undefined;
}

function exitMatch() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	playerPoints = [];
	opponentPoints = [];
	socket.emit("leave match");
	labels["result"].visible = false;
	labels["main menu"].visible = false;
	labels["main menu"].clickable = false;
	labels["rematch"].visible = false;
	labels["rematch"].clickable = false;
	labels["rematch"].disabled = false;
	labels["play"].visible = true;
	labels["play"].clickable = true;
	labels["logo"].visible = true;
}

function requestRematch() {
	if (logFull) console.log("%s(%j)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	socket.emit("request rematch");
}