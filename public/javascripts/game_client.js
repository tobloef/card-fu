var socket = io();

submitUsername(prompt("Please enter a username:"));

//////////  Socket Events  \\\\\\\\\\
socket.on("username response", function(response) {
    if (!response.exists) {
        displayMainScreen();
        getStats();
    } else {
        submitUsername(prompt("Username already exists, please enter a different one:"));
    }
});

socket.on("stats", function(stats) {
	displayStats(stats);
});

//////////  jQuery Events  \\\\\\\\\\
$("#enterQueue").click(function() {
    socket.emit("enter queue");
});


//////////  Methods  \\\\\\\\\\
function submitUsername(desiredUsername) {
    socket.emit("username submit", desiredUsername);
}

function getStats() {
    socket.emit("get stats");
}

function displayStats(stats) {
	$("#playerListHeader").text(stats.onlinePlayers.length + " players online:");
    $("#playerList").empty()
    for (var i = 0; i < stats.onlinePlayers.length; i++) {
        $("#playerList").append("<li>" + stats.onlinePlayers[i] + "</li>");
    }
}

function displayMainScreen() {
    $("#mainScreen").css("visibility", "visible");
}