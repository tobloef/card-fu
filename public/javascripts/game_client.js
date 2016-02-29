var socket = io();
var canPlayCard = false;
var playerPoints = [],
	opponentPoints = [];
var handSlots, opponentCard, playerCard;

//////////  Socket Events  \\\\\\\\\\
socket.on("enter match", function() {
	playButtonVisible = false;
	displayCardSlots = true;
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

socket.on("end match", function(winner, loser, reason) {
	matchEnded(winner, loser, reason);
});

//////////  Functions  \\\\\\\\\\
function enterQueue() {
	socket.emit("enter queue");
}

function updateCards(cards) {
	for (var i = 0; i < cards.length; i++) {
		handSlots[i].card = cards[i]
	}
	canPlayCard = true;
}

function playCard(index) {
	if (canPlayCard) {
		socket.emit("play card", index);
		canPlayCard = false;
	}
}

function unknownCardPlayed() {
	opponentCard = {isUnknown: true};
}

function displayResult(result) {
	var player = (result.winner.socketId === socket.id) ? result.winner : result.loser;
	var opponent = (result.winner.socketId !== socket.id) ? result.winner : result.loser;
	playerPoints = player.points;
	opponentPoints = opponent.points;
	opponentCard = opponent.card;
	setTimeout(function() {
		canPlayCard = true;
		opponentCard = undefined;
		playerCard = undefined;
		socket.emit("request cards update");
	}, (3 * 1000));
}

function matchEnded(winner, loser, reason) {
	setTimeout(function() {
		canPlayCard = false;
		var delay = 2.5;
		if (reason === "player left") {
			alert(["Your opponent", "You"][+(socket.id !== winner)] + " left the match. You " + ["lose", "win"][+(socket.id === winner)] + "!");
			delay = 1;
		} else if (reason === "player forfeit") {
			alert(["Your opponent", "You"][+(socket.id !== winner)] + " forfeited the match. You " + ["lose", "win"][+(socket.id === winner)] + "!");
			delay = 1;
		} else {
			alert(["Your opponent", "You"][+(socket.id === winner)] + " have a full set. You " + ["lose", "win"][+(socket.id === winner)] + "!");
		}
		setTimeout(function() {
			opponentCard = undefined;
			playerCard = undefined;
			for (var i = 0; i < handSlots.length; i++) {
				handSlots[i].card = undefined;
			}
			playerPoints = [];
			opponentPoints = [];
			displayCardSlots = false;
			playButtonText = "Play!";
			playButtonVisible = true;
			playButtonClickable = true;
		}, (delay * 1000));
	}, (0.5 * 1000));
}