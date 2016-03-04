var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("./libs/game_manager").listen(http);

app.set("port", (process.env.PORT || 3001));
app.use(express.static("public"));

//User connects to server
app.get("/", function(req, res) {
	//Will serve static pages
});

//If page doesn't exist
app.get("*", function(req, res) {
	res.send("404", 404);
});

//Start http server
http.listen(app.get("port"), function() {
	console.log("Node app started on port %s", app.get("port"));
});
