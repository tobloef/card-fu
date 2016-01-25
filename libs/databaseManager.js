var debug = require("debug")("database");
var db = require("monk")("localhost:27017/cardjitsu");

var users = db.get("users");

//Methods here