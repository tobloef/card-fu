var spacecats = new Audio("../sound/spacecats.mp3");
spacecats.volume = 0.5;
spacecats.addEventListener("ended", function() {
	this.currentTime = 0;
	this.play();
}, false);

var playing = false;

//                 up      up      down    down    left    right    left    right   b       a       enter
var konamiKeys = [38,     38,     40,     40,	   37,     39,      37,     39,     66,     65,     13];
var konamiIndex = 0;

$(document).keydown(function(e) {
	if (e.keyCode === konamiKeys[konamiIndex++]) {
		if (konamiIndex === konamiKeys.length) {
			konamiIndex = 0;
			if (playing) {
				spacecats.pause();
				playing = false;
			} else {
				spacecats.play();
				playing = true;
			}
		}
	} else {
		konamiIndex = 0;
	}
});
