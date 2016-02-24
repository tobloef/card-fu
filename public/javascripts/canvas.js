//////////  Prototypes  \\\\\\\\\\
String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
}
Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
};

//////////  Constructors  \\\\\\\\\\
function button(position, width, height, color, text, textColor, textSize, callback, visible) {
	this.position = position;
	this.height = height;
	this.width = width;
	this.color = color;
	this.text = text;
	this.textColor = textColor;
	this.textSize = textSize;
	this.callback = callback;
	this.visible = visible;
}


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
	findOpponentButton = new button({x: canvas.width/2 - 400 / 2 * r, y: canvas.height/2 - 100 / 2 * r}, 400, 100, "#53BD22", "Find Opponent", "#ffffff", 52, enterQueue, false);
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
	if (x > findOpponentButton.position.x && x < findOpponentButton.position.x + findOpponentButton.width * r &&
		y > findOpponentButton.position.y && y < findOpponentButton.position.y + findOpponentButton.height * r && findOpponentButton.visible) {
		if (!clickCursor) {
			$("#game-canvas").css("cursor","pointer");
			clickCursor = true;
		}
		return;
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
			handSlots[i].card = undefined;
			return;
		}
	}
	if (x > findOpponentButton.position.x && x < findOpponentButton.position.x + findOpponentButton.width * r &&
		y > findOpponentButton.position.y && y < findOpponentButton.position.y + findOpponentButton.height * r && findOpponentButton.visible) {
		enterQueue();
		findOpponentButton.text = "Searching...";
		return;
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
	if (findOpponentButton) {
		findOpponentButton.position = {x: canvas.width/2 - findOpponentButton.width / 2 * r, y: canvas.height/2 - findOpponentButton.height / 2 * r};
	}
}

//////////  Drawing  \\\\\\\\\\
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < handSlots.length; i++) {
		if (displayCardSlots) {
			if (handSlots[i].card) {
				drawCard(handSlots[i].card, handSlots[i].position, 1);
			} else {
				drawEmptySlot(handSlots[i]);
			}
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
	if (findOpponentButton.visible) {
		drawFindOpponentButton();
	}
}


function drawCard(card, position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = card.color;
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2 * scale * r;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(position.x + cardWidth * scale * 0.1, position.y + cardHeight * scale * 0.067, cardWidth * scale * 0.8, cardHeight * scale * 0.866);
	ctx.fillStyle = typeColors[card.type];
	ctx.textAlign = "center";
	ctx.font = "bold " + (64 * scale * r) + "px Arial";
	ctx.fillText(card.power, position.x + cardWidth * scale / 2, position.y + cardHeight * scale / 2);
	ctx.font = (32 * scale * r) + "px Arial";
	ctx.fillText(card.type.capitalize(), position.x + cardWidth * scale / 2, position.y + cardHeight * scale * 0.75);
}

function drawPointCard(card, position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = card.color;
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardWidth * scale);
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 4 * scale * r;
	ctx.strokeRect(position.x, position.y, cardWidth * scale, cardWidth * scale);
	ctx.fillStyle = typeColors[card.type];
	ctx.textAlign = "center";
	ctx.font = "bold " + (72 * scale * r) + "px Arial";
	ctx.fillText(card.type[0].toUpperCase(), position.x + cardWidth * scale / 2, position.y + cardWidth * scale * 0.7);
	ctx.strokeStyle = "#ffffff";
	ctx.lineWidth = 2 * r * scale;
	ctx.strokeText(card.type[0].toUpperCase(), position.x + cardWidth * scale / 2, position.y + cardWidth * scale * 0.7);
}

function drawUnknownCard(position, scale) {
	if (!scale) {
		scale = 1;
	}
	ctx.fillStyle = "#6f6f6f";
	ctx.fillRect(position.x, position.y, cardWidth * scale, cardHeight * scale);
	ctx.strokeStyle = "#000000";
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
	ctx.strokeStyle = "#000000";
	ctx.strokeRect(slot.position.x, slot.position.y, cardWidth, cardHeight);
}

function drawPoints() {
	for (var i = 0; i < playerPoints.length; i++) {
		for (var j = playerPoints[i].length - 1; j >= 0; j--) {
			drawPointCard(playerPoints[i][j], {x: cardWidth * 0.55 * i + 10 * r, y: cardHeight * 0.5 * j * 0.2 + 10 * r}, 0.5);
		}
	}

	for (var i = 0; i < opponentPoints.length; i++) {
		for (var j = opponentPoints[i].length - 1; j >= 0; j--) {
			drawPointCard(opponentPoints[i][j], {x: canvas.width - cardWidth * 0.55 * (3-i) - 5 * r, y: cardHeight * 0.5 * j * 0.2 + 10 * r}, 0.5);
		}
	}
}

function drawFindOpponentButton() {
	ctx.fillStyle = findOpponentButton.color;
	ctx.fillRect(findOpponentButton.position.x, findOpponentButton.position.y, findOpponentButton.width * r, findOpponentButton.height * r);
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 2 * r;
	ctx.strokeRect(findOpponentButton.position.x, findOpponentButton.position.y, findOpponentButton.width * r, findOpponentButton.height * r);
	ctx.fillStyle = findOpponentButton.textColor;
	ctx.textAlign = "center";
	ctx.font = (findOpponentButton.textSize * r) + "px Arial";
	ctx.fillText(findOpponentButton.text, findOpponentButton.position.x + findOpponentButton.width * r / 2, findOpponentButton.position.y + findOpponentButton.height * r * 0.68);
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

var canvas, ctx, clickPos, clickedCard, cardWidth, cardHeight, playerCardPosition, opponentCardPosition, findOpponentButton;
var clickCursor = false,
	displayCardSlots = false,
	aspect = 16 / 10;
var typeColors = {"fire": "#FF8B26", "water" : "#1260E6", "ice" : "#74D5F2"};

init();
animate();

window.addEventListener("resize", handleResize, false);
canvas.addEventListener("mousemove", handleMouseMove, false);
canvas.addEventListener("click", handleClick, false);
