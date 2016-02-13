var socket = io();
var username;
var canPlayCard = false;

submitUsername(prompt("Please enter a username between 3 and 16 characters.\nOnly letters, number and underscore is allowed."));

//////////  Socket Events  \\\\\\\\\\
socket.on("username response", function(response) {
	if (response.success) {
		username = response.username
		enterQueue();
	} else {
		submitUsername(prompt("Username either already exists or is invalid. Please enter a different one."));
	}
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

//////////  Functions  \\\\\\\\\\
function submitUsername(desiredUsername) {
	socket.emit("username submit", desiredUsername);
}

function enterQueue() {
	socket.emit("enter queue");
}

function updateCards(cards) {
	for (var i = 0; i < cards.length; i++) {
		setHandSlot(i, cards[i]);
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
	var player = (result.winner.username === username) ? result.winner : result.loser
	var opponent = (result.winner.username !== username) ? result.winner : result.loser;
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