String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
}
Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
};

function card(type, power, color) {
	if (arguments.length > 1) {
		this.type = type;
		this.power = power;
		this.color = color;
	}
}

function init() {
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");
	handleResize();
	deck = shuffleDeck(generateDeck());
	handSlots = [];
	for (var i = 1; i < 6; i++) {
		handSlots.push({
			position: {
				x: canvas.width / 6 * i - cardWidth / 2,
				y: canvas.height - cardHeight * 1.1
			},
			card: undefined
		});
	}
	for (var i = 0; i < handSlots.length; i++) {
		handSlots[i].card = deck.shift();
	}
}

function animate() {
	requestAnimFrame(animate);
	draw();
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < handSlots.length; i++) {
		if (handSlots[i].card) {
			drawCardSlot(handSlots[i]);
		} else {
			drawEmptySlot(handSlots[i]);
		}
	}
}

function drawCardSlot(slot) {
	drawCard(slot.card, slot.position, 1);
}

function drawCard(card, position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = (card.unknown) ? "#6f6f6f" : card.color;
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.lineWidth = 2;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.fillStyle = (card.unknown) ? "#a0a0a0" : "#FFFFFF";
	ctx.fillRect(position.x + cardWidth * scale * 0.1, position.y + cardHeight * scale * 0.067, cardWidth * scale * 0.8, cardHeight * scale * 0.866);
	ctx.textAlign = "center";
	if (card.unknown) {
		ctx.fillStyle = "#d1d1d1";
		ctx.font = (72 * r * scale) + "px Arial";
		ctx.fillText("?", position.x + cardWidth * scale / 2, position.y + cardHeight * 0.6 * scale);
	} else {
		ctx.fillStyle = typeColors[types.indexOf(card.type)];
		ctx.font = (64 * scale * r) + "px Arial";
		ctx.fillText(card.power, position.x + cardWidth * scale / 2, position.y + cardHeight * scale * 0.45);
		ctx.font = (32 * scale * r) + "px Arial";
		ctx.fillText(card.type.capitalize(), position.x + cardWidth * scale / 2, position.y + cardHeight * scale * 0.75);
	}
}

function drawEmptySlot(slot) {
	ctx.fillStyle = "#a0a0a0";
	ctx.fillRect(slot.position.x, slot.position.y, cardWidth, cardHeight);
	ctx.fillStyle = "#000000";
	ctx.strokeRect(slot.position.x, slot.position.y, cardWidth, cardHeight);
}

function handleResize() {
	if (window.innerWidth < window.innerHeight * aspect) {
		canvas.width = window.innerWidth * 0.9;
		canvas.height = window.innerWidth * 0.9 / aspect;
		r = canvas.width / 1000;
	} else {
		canvas.width = window.innerHeight * 0.9 * aspect;
		canvas.height = window.innerHeight * 0.9;
		r = canvas.height * aspect / 1000;
	}
	cardWidth = 120 * r;
	cardHeight = cardWidth * 1.5;
	if (handSlots) {
		for (var i = 1; i < 6; i++) {
			handSlots[i-1].position = {
				x: canvas.width / 6 * i - cardWidth / 2,
				y: canvas.height - cardHeight * 1.1
			};
		}
	}
}

function generateDeck() {
	var c = Math.floor(Math.random() * (6));
	deck = [];
	for (var t = 0; t < types.length; t++) {
		for (var n = 1; n < powers.length; n++) {
			deck.push(new card(types[t], powers[n], colors[c++ % 6]));
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
var canvas, ctx, clickPos, clickedCard, wr, hr, deck, cardWidth, cardHeight, oldSize, handSlots;
var types = ["fire", "water", "ice"];
var powers = [10, 8, 7, 6, 5, 5, 4, 3, 3, 2];
var colors = ["yellow", "orange", "green", "blue", "red", "purple"];
var typeColors = ["#FF8B26", "#1260E6", "#74D5F2"];
var aspect = 16 / 10;

init();
animate();

window.addEventListener("resize", handleResize, false);