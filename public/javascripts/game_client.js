var socket = io();
var username;

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

socket.on("initial hand", function(cards) {
	displayInitialHand(cards);
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
	console.log("%s", arguments.callee.name);
	socket.emit("username submit", desiredUsername);
}

function getStats() {
	console.log("%s", arguments.callee.name);
	socket.emit("get stats");
}

function displayStats(stats) {
	console.log("%s", arguments.callee.name);
	$("#player_list_header").text(stats.onlinePlayers.length + " players online:");
	$("#player_list").empty();
	for (var i = 0; i < stats.onlinePlayers.length; i++) {
		$("#player_list").append("<li>" + stats.onlinePlayers[i] + "</li>");
	}
}

function getPlayerInfo() {
	console.log("%s", arguments.callee.name);
	socket.emit("get user info");
}

function displayPlayerInfo(info) {
	console.log("%s", arguments.callee.name);
	$("#user_info").text("Hello " + info.username + ", you have an ELO of " + info.elo + ".");
}

function displayMainScreen() {
	console.log("%s", arguments.callee.name);
	$("#main_screen").css("visibility", "visible");
}

function enterQueue() {
	console.log("%s", arguments.callee.name);
	socket.emit("enter queue");
	$("#queue_button").html("Leave Queue");
	$("#queue_button").off("click").on("click", leaveQueue);
}

function leaveQueue() {
	console.log("%s", arguments.callee.name);
	socket.emit("leave queue");
	$("#queue_button").html("Enter Queue");
	$("#queue_button").off("click").on("click", enterQueue);
}

function queueEntered() {
	console.log("%s", arguments.callee.name);
	$("#log").append("<li>" + "Entered the queue. Waiting for an opponent..." + "</li>");
}

function queueLeft() {
	console.log("%s", arguments.callee.name);
	$("#log").append("<li>" + "Left the queue." + "</li>");
}

function prepareForMatch(usernames) {
	console.log("%s", arguments.callee.name);
	$("#log").append("<li>" + "Match started " + usernames.join(" vs ") + "</li>");
	$("#match_screen").css("visibility", "visible");
}

function clearLog() {
	console.log("%s", arguments.callee.name);
	$("#log").empty();
}

function displayInitialHand(cards) {
	console.log("%s", arguments.callee.name);
	$(".card_button").css("visibility", "visible");
	for (var i = 0; i < cards.length; i++) {
		$(".card_button#" + i).html(cards[i].type + " " + cards[i].number);
	}
}

function playCard(index) {
	console.log("%s", arguments.callee.name);
	socket.emit("play card", index);
	$(".card_button#" + index).html("");
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
	$("#log").append("<li>" + "Both players has played a card, the result was:" + "</li>");
	$("#log").append("<li>" + "Your " + you.card.type + " " + you.card.number + " vs " + opponent.username + "'s " + opponent.card.type + " " + opponent.card.number + "</li>");
	$("#log").append("<li>" + winner + " win this round." + "</li>");
}