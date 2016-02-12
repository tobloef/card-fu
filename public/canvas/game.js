String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function card(type, power, color, position) {
	this.type = type;
	this.power = power;
	this.color = color;
	if (position === undefined) {
		this.position = {
			x: 0,
			y: 0
		};
	} else {
		this.position = position;
	}
}

function init() {
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");
	handleResize();
	deck = shuffleDeck(generateDeck());
}

function animate() {
	requestAnimFrame(animate);
	draw();
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < deck.length; i++) {
		drawCard(deck[i]);
	}
}

function handleResize() {
	if (window.innerWidth < window.innerHeight * aspect) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerWidth / aspect;
		r = canvas.width / 1000;
	} else {
		canvas.width = window.innerHeight * aspect;
		canvas.height = window.innerHeight;
		r = canvas.height * aspect / 1000;
	}
	cardWidth = 150 * r;
	cardHeight = 225 * r;
	if (oldSize) {
		var widthRatio = canvas.width / oldSize.width;
		var heightRatio = canvas.height / oldSize.height;
		for (var i = 0; i < deck.length; i++) {
			deck[i].position.x *= widthRatio;
			deck[i].position.y *= heightRatio;
		}
	}
	oldSize = {width: canvas.width, height: canvas.height};
}

function drawCard(card) {
	var posX = card.position.x;
	var posY = card.position.y;
	ctx.fillStyle = card.color;
	ctx.fillRect(posX, posY, cardWidth, cardHeight);
	ctx.lineWidth = 2;
	ctx.strokeRect(posX, posY, cardWidth, cardHeight);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(posX + cardWidth * 0.1, posY + cardHeight * 0.067, cardWidth * 0.8, cardHeight * 0.866);
	ctx.fillStyle = typeColors[types.indexOf(card.type)];
	ctx.textAlign = "center";
	ctx.font = (70 * r) + "px Arial";
	ctx.fillText(card.power, posX + cardWidth/2, posY + cardHeight*0.45);
	ctx.font = (40 * r) + "px Arial";
	ctx.fillText(card.type.capitalize(), posX + cardWidth/2, posY + cardHeight*0.75);
}

function handleMouseDown(event) {
	var x = (event.pageX - canvas.offsetLeft),
		y = (event.pageY - canvas.offsetTop);
	for (var i = deck.length - 1; i >= 0; i--) {
		if (deck[i].position.x < x && x < deck[i].position.x + cardWidth &&
			deck[i].position.y < y && y < deck[i].position.y + cardHeight) {
			clickPos = {x: x - deck[i].position.x, y: y - deck[i].position.y};
			clickedCard = deck[i];
			deck.move(i, deck.length - 1);
			return;
		}
	}
}

function handleMouseUp(event) {
	clickedCard = undefined;
}

function handleMouseMove(event) {
	if (clickedCard) {
		var x = (event.pageX - canvas.offsetLeft),
			y = (event.pageY - canvas.offsetTop);
		clickedCard.position = {x: x - clickPos.x, y: y - clickPos.y};
	}
}

function generateDeck() {
	var c = Math.floor(Math.random() * (6));
	deck = [];
	for (var t = 0; t < types.length; t++) {
		for (var n = 1; n < powers.length; n++) {
			deck.push(new card(types[t], powers[n], colors[c++ % 6], {x: 0, y: 0}));
		}
	}
	return deck;
}

function shuffleDeck(deck) {
	var deckCopy = deck.slice();
	for (var i = deckCopy.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = deckCopy[i];
		deckCopy[i] = deckCopy[j];
		deckCopy[j] = temp;
	}
	return deckCopy;
}

window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
		   window.webkitRequestAnimationFrame ||
		   window.mozRequestAnimationFrame ||
		   window.oRequestAnimationFrame ||
		   window.msRequestAnimationFrame ||
		   function (callback, element) {
		       window.setTimeout(callback, 1000 / 60);
		   };
})();

var canvas, ctx, clickPos, clickedCard, wr, hr, deck, cardWidth, cardHeight, oldSize;

var types = ["fire", "water", "ice"];
var powers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];
var typeColors = ["#FF8B26", "#1260E6", "#74D5F2"];
var aspect = 16/8;

init();

animate();
window.addEventListener("resize", handleResize, false);
canvas.addEventListener("mousedown", handleMouseDown, false);
canvas.addEventListener("mouseup", handleMouseUp, false);
canvas.addEventListener("mousemove", handleMouseMove, false);
