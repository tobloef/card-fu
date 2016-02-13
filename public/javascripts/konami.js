spacecats = new Audio("../sound/spacecats.mp3");
spacecats.volume = 0.5;
spacecats.addEventListener("ended", function() {
	this.currentTime = 0;
	this.play();
}, false);

var playing = false;
var konami_keys = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
var konami_index = 0;
$(document).keydown(function(e){
	if(e.keyCode === konami_keys[konami_index++]){
		if(konami_index === konami_keys.length){
			konami_index = 0;
			if (playing) {
				spacecats.pause();
				playing = false;
			} else {
				spacecats.play();
				playing = true;
			}
		}
	}else{
		konami_index = 0;
	}
});