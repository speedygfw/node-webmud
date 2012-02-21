var mingy = require('mingy'),Parser = mingy.Parser,Shell = mingy.Shell;
var sty = require('sty');
var redis = require("redis");
var config = require("./config");

var mud = require("./mud");
var fs = require("fs");
//var client = redis.createClient();



//client.on("error", function (err) {
 //   console.log("Error " + err);
//});


// define locations in our special game
function Location() {}

mud.loadLocations();
mud.loadProps();

sty.enable();


// define props in our special game
function Prop() {}





// set up parser and commands
var parser = new Parser();

// prop validator restricts lexeme to props in current location
parser.addValidator('propPresent', function (lexeme, env) {

    // make sure prop exists
    var success = (env.props[lexeme]) ? true : false;

    // make sure prop is in current location
    if (success && (env.props[lexeme].location != env.location)) {
        success = false;
    }

    return {
        'success':success,
        'message':"I don't see that.\n"
    }
});

parser.addValidator('propHeld', function (lexeme, env) {

    // make sure prop exists
    var success = (env.props[lexeme]) ? true : false;

    // make sure prop is in player's inventory
    if (success && (env.props[lexeme].location != 'player')) {
        success = false
    }

    return {
        'success':success,
        'message':"I don't have that.\n"
    }
});

mud.loadCommands(parser);

parser.addCommand('nick')
    .set('syntax', ['nick <string:username>'])
    .set('logic', function (args, env, system) {

        var output = '';

        env.users[system.stream.userID].name = args.username;

        output += "Du bist nun bekannt als " + args.username + ".\n";

        return output
    });

parser.addCommand('say')
    .set('syntax', ['say <string:message*>'])
    .set('logic', function (args, env, system) {

        var output = "You say your piece.\n";

        var name = env.users[system.stream.userID].name;
        var location = env.users[system.stream.userID].location;

        // broadcast to nearby users
        for (var userID in env.users) {
            var user = env.users[userID];
            if (user.location == location && (userID != system.stream.userID)) {
                user.messages.push(name + " says '" + args['message*'] + "'.\n")
            }
        }

        return output
    });


parser.addValidator('direction', function (lexeme) {

    var validDirections = ['north', 'south', 'east', 'west'];

    return {
        'success':(validDirections.indexOf(lexeme) != -1),
        'message':"That's not a direction I understand.\n"
    }
});

parser.addCommand('teleport')
    .set('syntax', ['teleport <string:roomname>'])
    .set('logic', function (args, env, system) {
        env.users[system.stream.userID].location = args.roomname;
        return args.roomname;
    });


parser.addCommand('go')
    .set('syntax', ['go <direction:direction>'])
    .set('logic', function (args, env, system) {

        var output = '';
        var direction = args.direction;
        var userLocation = env.users[system.stream.userID].location;

        var location = env.locations[userLocation];

        if (location.exits[direction]) {
            output += "You go " + direction + ".\n";
            env.users[system.stream.userID].location = location.exits[direction];

            //output += env.locations[location.exits[direction]].description;
        }
        else {
            output += "You can't go that way.\n"
        }

        return output
    });

parser.setEnv('locations', mud.locations);
parser.setEnv('sty', sty);
parser.setEnv('location', 'hallway');
parser.setEnv('props', mud.props);
parser.setEnv('users', {});
parser.setEnv('userNumber', 1);

// begin adventurings!
var welcome = 'Welcome to EDungeon MUD!\n\n' +
    'Not much happens here, but the stress level is low.\n';

var shell = new Shell(parser)
.set('port', config.port)
.set('welcome', welcome)
.set('connectLogic', function(shell, system) {

  var guestName = "Guest" + shell.parser.env.userNumber;
  console.log(guestName + " connected.");
  // set user properties to default
  shell.parser.env.users[system.stream.userID] = {
      "name":guestName,
      "location":"hallway",
      "messages":[]
  };

  shell.parser.env.userNumber++;

  return "You are now known as " + guestName + ".\n"
})
.set('logic', function(shell, system) {

  var output = ''
      , message
      , messages;

  if (shell.parser.env.users[system.stream.userID]) {
    // relay anything sent by other users
    messages = shell.parser.env.users[system.stream.userID].messages;
    for (var index in messages) {
      output += messages.pop()
    }
  }

  return output
})
.startServer()
