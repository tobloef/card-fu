var socket = io();

submitUsername(prompt("Please enter a username:"));

//////////  Socket Events  \\\\\\\\\\
socket.on("username response", function(response) {
    if (!response.exists) {
        displayMainScreen();
    } else {
        submitUsername(prompt("Username already exists, please enter a different one:"));
    }
});

//////////  jQuery Events  \\\\\\\\\\
$("#enterQueue").click(function() {
    socket.emit("enter queue");
});


//////////  Methods  \\\\\\\\\\
function submitUsername(desiredUsername) {
    socket.emit("username submit", desiredUsername);
}

function displayMainScreen() {
    $("#stats").css("display", "initial");
    $("#enterQueue").css("display", "initial");
}