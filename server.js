
var http = require('http');
var redis = require("redis"),
    client = redis.createClient();
var testa = "not redis";

client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("test", "Redis", redis.print);
client.get("test", testa);

var server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("Hello world from "+testa+"\n");
});

server.listen(process.env.PORT || 8001);
