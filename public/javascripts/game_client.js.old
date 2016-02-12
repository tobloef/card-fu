var socket = io();
var username;
var canPlayCard = false;

spacecats = new Audio("../sound/spacecats.mp3");
spacecats.addEventListener("ended", function() {
    this.currentTime = 0;
    this.play();
}, false);
spacecats.play();

submitUsername(prompt("Please enter a username between 3 and 16 characters.\nOnly letters, number and underscore is allowed."));

//////////  Socket Events  \\\\\\\\\\
socket.on("username response", function(response) {
	if (response.success) {
		username = response.username
		displayMainScreen();
	} else {
		submitUsername(prompt("Username either already exists or is invalid. Please enter a different one."));
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

socket.on("unknown card played", function() {
	unknownCardPlayed();
});

socket.on("fight result", function(result) {
	displayResult(result);
});

socket.on("end match", function(winner, loser, reason) {
	matchEnded(winner, loser, reason);
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
	$("#user_info").text("Hello " + info.username + ", you have an ELO of " + Math.round(info.elo) + ".");
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
		$(".card_button#" + i).html(cards[i].color + "<br> " + cards[i].type + " " + cards[i].power);
	}
	canPlayCard = true;
}

function playCard(index) {
	if (canPlayCard) {
		socket.emit("play card", index);
		$("#log").append("<li>" + "You played card " + $(".card_button#" + index).html().replace("<br>", "") + "</li>");
		$(".card_button#" + index).html("");
		canPlayCard = false;
	}
}

function unknownCardPlayed(username) {
	$("#log").append("<li>" + "Your opponent played a card!" + "</li>");
}

function displayResult(result) {
	var you;
	var opponent;
	var winner;
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
	$("#log").append("<li>" + "Your " + you.card.color + " " + you.card.type + " " + you.card.power + " vs " + opponent.username + "'s " + you.card.color + " " + opponent.card.type + " " + opponent.card.power + "</li>");
	if (!result.tied) {
		$("#log").append("<li>" + winner + " win this round." + "</li>");
	} else {
		$("#log").append("<li>" + "You got tied this round!" + "</li>");
	}
	canPlayCard = true;
}

function leaveMatch() {
	if (confirm("Are you sure you want to leave the match? You will automatically lose the game.")) {
		socket.emit("leave match");
		resetMatchScreen();
	}
}

function matchEnded(winner, loser, reason) {
	if (username === winner) {
		if (reason === "player left") {
			$("#log").append("<li>" + "Your opponent left the match. You win!" + "</li>");
		} else if (reason === "player forfeit") {
			$("#log").append("<li>" + "Your opponent forfeited the match. You win!" + "</li>");
		} else {
			winningSet = "";
			for (var i = 0; i < reason.length; i++) {
				winningSet += "<br>" + reason[i].color + " " + reason[i].type + " " + reason[i].power;
			}
			$("#log").append("<li>" + "You won the game! Your wining set was:" + winningSet + "</li>");
		}
	} else {
		if (reason === "player left") {
			$("#log").append("<li>" + "You left the match and lost." + "</li>");
		} else if (reason === "player forfeit") {
			$("#log").append("<li>" + "You forfeited the match and lost." + "</li>");
		} else {
			winningSet = "";
			for (var i = 0; i < reason.length; i++) {
				winningSet += "<br>" + reason[i].color + " " + reason[i].type + " " + reason[i].power;
			}
			$("#log").append("<li>" + "You lost the match! Your opponent's wining set was:" + winningSet + "</li>");
		}
	}
	resetMatchScreen();
}

function resetMatchScreen() {
	$("#match_screen").css("visibility", "hidden");
	$("#queue_button").html("Enter Queue");
	$("#queue_button").off("click").on("click", enterQueue);
	$(".card_button").css("visibility", "hidden");
	$(".card_button").html("");
}

function updatePoints(points) {
	
}