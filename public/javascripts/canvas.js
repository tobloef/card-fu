//////////  Prototypes  \\\\\\\\\\
String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
}
Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
};

//////////  Canvas  \\\\\\\\\\
function init() {
	canvas = document.getElementById("game-canvas");
	ctx = canvas.getContext("2d");
	handleResize();
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
	clickCursor = false;
}

function animate() {
	requestAnimFrame(animate);
	draw();
}

//////////  Events  \\\\\\\\\\
function handleMouseMove(event) {
	var x = (event.pageX - canvas.offsetLeft),		
		y = (event.pageY - canvas.offsetTop);
	for (var i = 0; i < handSlots.length; i++) {
		if (x > handSlots[i].position.x && x < handSlots[i].position.x + cardWidth &&
			y > handSlots[i].position.y && y < handSlots[i].position.y + cardHeight && handSlots[i].card) {
			if (!clickCursor) {
				$("#game-canvas").css("cursor","pointer");
				clickCursor = true;
			}
			return;
		}
	}
	$("#game-canvas").css("cursor","auto");
	clickCursor = false;
}

function handleClick(event) {
	var x = (event.pageX - canvas.offsetLeft),		
		y = (event.pageY - canvas.offsetTop);
	for (var i = 0; i < handSlots.length; i++) {
		if (x > handSlots[i].position.x && x < handSlots[i].position.x + cardWidth &&
			y > handSlots[i].position.y && y < handSlots[i].position.y + cardHeight &&
			handSlots[i].card && canPlayCard) {
			playCard(i);
			playerCard = handSlots[i].card;
			setHandSlot(i, undefined);
			return;
		}
	}
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
	playerCardPosition = {x: canvas.width * 0.17, y: canvas.height * 0.15};
	opponentCardPosition = {x: canvas.width * 0.83 - cardWidth * 1.5, y: canvas.height * 0.15};
}

//////////  Drawing  \\\\\\\\\\
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < handSlots.length; i++) {
		if (handSlots[i].card) {
			drawCard(handSlots[i].card, handSlots[i].position, 1);
		} else {
			drawEmptySlot(handSlots[i]);
		}
	}
	drawPoints();
	if (playerCard) {
		drawCard(playerCard, playerCardPosition, 1.5);
	}
	if (opponentCard) {
		if (opponentCard.isUnknown) {
			drawUnknownCard(opponentCardPosition, 1.5);
		} else {
			drawCard(opponentCard, opponentCardPosition, 1.5);
		}
	}
}


function drawCard(card, position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = card.color;
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.lineWidth = 2 * scale * r;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(position.x + cardWidth * scale * 0.1, position.y + cardHeight * scale * 0.067, cardWidth * scale * 0.8, cardHeight * scale * 0.866);
	ctx.fillStyle = typeColors[card.type];
	ctx.textAlign = "center";
	ctx.font = "bold " + (64 * scale * r) + "px Arial";
	ctx.fillText(card.power, position.x + cardWidth * scale / 2, position.y + cardHeight * scale * 0.45);
	ctx.font = (32 * scale * r) + "px Arial";
	ctx.fillText(card.type.capitalize(), position.x + cardWidth * scale / 2, position.y + cardHeight * scale * 0.75);
}

function drawPointCard(card, position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = card.color;
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardWidth * scale);
	ctx.lineWidth = 4 * scale * r;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardWidth * scale);
	ctx.fillStyle = typeColors[card.type];
	ctx.textAlign = "center";
	ctx.font = "bold " + (72 * scale * r) + "px Arial";
	ctx.fillText(card.type[0].toUpperCase(), position.x + cardWidth * scale / 2, position.y + cardWidth * scale * 0.7);
}

function drawUnknownCard(position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = "#6f6f6f";
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.lineWidth = 2 * scale * r;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.fillStyle = "#a0a0a0";
	ctx.fillRect(position.x + cardWidth * scale * 0.1, position.y + cardHeight * scale * 0.067, cardWidth * scale * 0.8, cardHeight * scale * 0.866);
	ctx.fillStyle = "#d1d1d1";
	ctx.textAlign = "center";
	ctx.font = "bold " + (72 * r * scale) + "px Arial";
	ctx.fillText("?", position.x + cardWidth * scale / 2, position.y + cardHeight * 0.6 * scale);
}

function drawEmptySlot(slot) {
	ctx.fillStyle = "#a0a0a0";
	ctx.fillRect(slot.position.x, slot.position.y, cardWidth, cardHeight);
	ctx.fillStyle = "#000000";
	ctx.strokeRect(slot.position.x, slot.position.y, cardWidth, cardHeight);
}

function drawPoints() {
	for (var i = 0; i < playerPoints.length; i++) {
		for (var j = playerPoints[i].length - 1; j >= 0; j--) {
			drawPointCard(playerPoints[i][j], {x: cardWidth * 0.6 * i + 10 * r, y: cardHeight * 0.5 * j * 0.2 + 10 * r}, 0.5);
		}
	}
}

//////////  Functions  \\\\\\\\\\

function setHandSlot(index, card) {
	handSlots[index].card = card;
}

function enterQueue() {
	alert("entered queue")
}

//////////  Initialize  \\\\\\\\\\
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

var canvas, ctx, clickPos, clickedCard, wr, hr, cardWidth, cardHeight, handSlots, clickCursor, opponentCard, playerCard,
playerCardPosition, opponentCardPosition;
var playerPoints = [],
	opponentPoints = [];
var typeColors = {"fire": "#FF8B26", "water" : "#1260E6", "ice" : "#74D5F2"};
var aspect = 16 / 10;

init();
animate();

window.addEventListener("resize", handleResize, false);
canvas.addEventListener("mousemove", handleMouseMove, false);
canvas.addEventListener("click", handleClick, false);