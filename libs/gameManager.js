var debug = require("debug")("game");
var socketio = require("socket.io")
var dbm = require("../libs/databaseManager");

module.exports.listen = function(app) {
    io = socketio.listen(app);
    io.on("connection", function(socket) {
		//Handle socket connections
    });
    return io;
}
