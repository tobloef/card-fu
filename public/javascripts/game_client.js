// This file manages the games client's logic. It's here that Socket.io connections are handled
// and functions from canvas.js are used to manage the game's visual appearance.

var socket = io();
var canPlayCard = false;
var logFull = false;
var playerPoints = [],
	opponentPoints = [];
var opponentCard, playerCard, matchWinner, matchEndReason, readyToEnd, timerInterval;

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
	if (labels["waiting"].visiblen || labels["rematch"].visible) {
		labels["waiting"].visible = false;
		labels["rematch"].disabled = true;
		labels["rematch"].clickable = false;
		labels["rematch"].visible = true;
	}
});

//////////  Functions  \\\\\\\\\\
function enterQueue() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	socket.emit("enter queue");
	labels["play"].visible = false;
	labels["play"].clickable = false;
	labels["searching"].visible = true;
}

function enterMatch() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	playerPoints = [];
	opponentPoints = [];
	labels["result"].visible = false;
	labels["main menu"].visible = false;
	labels["main menu"].clickable = false;
	labels["rematch"].visible = false;
	labels["rematch"].clickable = false;
	labels["rematch"].disabled = false;
	labels["waiting"].visible = false;
	labels["timer"].text = 20;
	labels["timer"].visible = true;
	timerInterval = setInterval(updateTimer, 1000);
	resetDots(labels["waiting"]);
	labels["searching"].visible = false;
	resetDots(labels["searching"]);
	labels["logo"].visible = false;
	displayCardSlots = true;
}

function updateCards(cards) {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	for (var i = 0; i < cards.length; i++) {
		handSlots[i].card = cards[i];
	}
	canPlayCard = true;
}

function playCard(index) {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	if (canPlayCard) {
		socket.emit("play card", index);
		canPlayCard = false;
	}
}

function unknownCardPlayed() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	opponentCard = {isUnknown: true};
}

function displayResult(result) {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	var player = undefined;
	var opponent = undefined;
	if (result.winner.socketId === socket.id) {
		player = result.winner;
		opponent = result.loser;
	} else {
		player = result.loser;
		opponent = result.winner;
	}
	playerPoints = player.points;
	opponentPoints = opponent.points;
	opponentCard = opponent.card;
	clearInterval(timerInterval);
	setTimeout(function() {
		if (readyToEnd) {
			endMatch();
		} else {
			canPlayCard = true;
			opponentCard = undefined;
			playerCard = undefined;
			labels["timer"].text = 20;
			timerInterval = setInterval(updateTimer, 1000);
			canPlayCard = true;
			socket.emit("request cards update");
		}
	}, (2 * 1000));
}

function endMatch() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
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
	labels["timer"].visible = false;
	labels["timer"].text = 20;
	clearInterval(timerInterval);
	matchWinner = undefined;
	matchEndReason = undefined;
}

function exitMatch() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	playerPoints = [];
	opponentPoints = [];
	socket.emit("leave match");
	labels["result"].visible = false;
	labels["main menu"].visible = false;
	labels["main menu"].clickable = false;
	labels["rematch"].visible = false;
	labels["rematch"].clickable = false;
	labels["rematch"].disabled = false;
	labels["waiting"].visible = false;
	resetDots(labels["waiting"]);
	labels["play"].visible = true;
	labels["play"].clickable = true;
	labels["logo"].visible = true;
}

function requestRematch() {
	if (logFull) console.log("%s(%s)", arguments.callee.name, Array.prototype.slice.call(arguments).sort());
	socket.emit("request rematch");
	labels["rematch"].visible = false;
	labels["rematch"].clickable = false;
	labels["waiting"].visible = true;
}

function animateLabels() {
	var dotLabels = [labels["waiting"], labels["searching"]];
	for (var i = 0; i < dotLabels.length; i++) {
		if (dotLabels[i].visible) {
			updateDots(dotLabels[i]);
		}
	}
}

function updateDots(label) {
	var dots = label.text.split(".").length - 1;
	var newDots = ((dots + 1) % 4);
	label.text = label.text.slice(0, -3) + Array(newDots + 1).join(".") + Array(3 - newDots + 1).join(" ");
}

function resetDots(label) {
	label.text = label.text.slice(0, -3) + "...";
}

function updateTimer() {
	labels["timer"].text -= 1;
	if (labels["timer"].text === 0) {
		canPlayCard = false;
		clearInterval(timerInterval);
	}
}
