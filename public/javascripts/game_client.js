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
		//TODO
	} else {
		submitUsername(prompt("Username either already exists or is invalid. Please enter a different one."));
	}
});


//////////  Methods  \\\\\\\\\\
function submitUsername(desiredUsername) {
	socket.emit("username submit", desiredUsername);
}