var socket = io();
var username;
var canPlayCard = false;

submitUsername(prompt("Please enter a username:"));

//////////  Socket Events  \\\\\\\\\\
socket.on("username response", function(response) {
	if (!response.exists) {
		username = response.username
		displayMainScreen();
	} else {
		submitUsername(prompt("Username already exists, please enter a different one:"));
	}
});

socket.on("player info", function(stats) {
	displayPlayerInfo(stats);
});

socket.on("stats", function(stats) {
	displayStats(stats);
});

socket.on("enter match", function(usernames) {
	prepareForMatch(usernames);
});

socket.on("queue entered", function() {
	queueEntered();
});

socket.on("queue left", function() {
	queueLeft();
});

socket.on("update cards", function(cards) {
	updateCards(cards);
});

socket.on("card drawn", function(card) {
	cardDrawn(card);
});


socket.on("unknown card played", function(username) {
	unknownCardPlayed(username);
});

socket.on("fight result", function(result) {
	displayResult(result);
});

//////////  jQuery Events  \\\\\\\\\\
$("#queue_button").click(enterQueue);

$("#clear_button").click(clearLog);

$(".card_button").click(function() {
	playCard(this.id);
});


//////////  Methods  \\\\\\\\\\
function submitUsername(desiredUsername) {
	socket.emit("username submit", desiredUsername);
}

function getStats() {
	socket.emit("get stats");
}

function displayStats(stats) {
	$("#player_list_header").text(stats.onlinePlayers.length + " players online:");
	$("#player_list").empty();
	for (var i = 0; i < stats.onlinePlayers.length; i++) {
		$("#player_list").append("<li>" + stats.onlinePlayers[i] + "</li>");
	}
}

function getPlayerInfo() {
	socket.emit("get user info");
}

function displayPlayerInfo(info) {
	$("#user_info").text("Hello " + info.username + ", you have an ELO of " + info.elo + ".");
}

function displayMainScreen() {
	$("#main_screen").css("visibility", "visible");
}

function enterQueue() {
	socket.emit("enter queue");
	$("#queue_button").html("Leave Queue");
	$("#queue_button").off("click").on("click", leaveQueue);
}

function leaveQueue() {
	socket.emit("leave queue");
	$("#queue_button").html("Enter Queue");
	$("#queue_button").off("click").on("click", enterQueue);
}

function queueEntered() {
	$("#log").append("<li>" + "Entered the queue. Waiting for an opponent..." + "</li>");
}

function queueLeft() {
	$("#log").append("<li>" + "Left the queue." + "</li>");
}

function prepareForMatch(usernames) {
	$("#log").append("<li>" + "Match started " + usernames.join(" vs ") + "</li>");
	$("#match_screen").css("visibility", "visible");
	$("#queue_button").html("Leave Match");
	$("#queue_button").off("click").on("click", leaveMatch);
}

function clearLog() {
	$("#log").empty();
}

function updateCards(cards) {
	$(".card_button").css("visibility", "visible");
	for (var i = 0; i < cards.length; i++) {
		$(".card_button#" + i).html(cards[i].color + " " + cards[i].type + " " + cards[i].number);
	}
	canPlayCard = true;
}

function playCard(index) {
	if (canPlayCard) {
		socket.emit("play card", index);
		$("#log").append("<li>" + "You played card " + $(".card_button#" + index).html() + "</li>");
		$(".card_button#" + index).html("");
		canPlayCard = false;
	}
}

function unknownCardPlayed(username) {
	$("#log").append("<li>" + username + " played a card!" + "</li>");
}

function displayResult(result) {
	if (result.winner.username === username) {
		you = result.winner;
		opponent = result.loser;
		winner = "You";
	} else if (result.loser.username === username) {
		you = result.loser;
		opponent = result.winner;
		winner = opponent.username;
	}
	$("#log").append("<li>" + "You have both played a card, the result was:" + "</li>");
	$("#log").append("<li>" + "Your " + you.card.color + " " + you.card.type + " " + you.card.number + " vs " + opponent.username + "'s " + you.card.color + " " + opponent.card.type + " " + opponent.card.number + "</li>");
	if (!result.tied) {
		$("#log").append("<li>" + winner + " win this round." + "</li>");
	} else {
		$("#log").append("<li>" + "You tied!" + "</li>");
	}
}

function leaveMatch() {
	if (confirm("Are you sure you want to leave the match? You will automatically lose the game.")) {
		socket.emit("leave match");
		clearLog();
		$("#queue_button").html("Enter Queue");
		$("#queue_button").off("click").on("click", enterQueue);
	}
}