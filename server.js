var mingy = require('mingy'),Parser = mingy.Parser,Shell = mingy.Shell;
var sty = require('sty');
var redis = require("redis");
var config = require("./config");
var mud = require("./mud");
var fs = require("fs");
var client = redis.createClient();



client.on("error", function (err) {
    console.log("Error " + err);
});


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

parser.addCommand('quit')
.set('syntax', ['quit', 'exit'])
.set('logic', function(args, env, system) {
  delete env.users[system.stream.userID];
  delete system.stream.userID;
  return "Goodbye!\n";
});

var hcommand = mud.loadCommand();
//eval(hcommand.logic);
console.log(hcommand.logic);

//eval("hcommand.logic");

eval(hcommand.logic);

parser.addCommand(hcommand.name)
    .set('syntax', hcommand.syntax)
    .set('logic', mud.commands[hcommand.name]);


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

parser.addCommand('look')
    .set('syntax', config.commands.syntax)
    .set('logic', function (args, env, system) {

        var output = '';

        var location_name = env.users[system.stream.userID].location;
        var location = env.locations[location_name];
        // describe location
        output += location.description + "\n";
        output += "Exits:";

        for (var p in location.exits)
            output += p + ',';

        // describe nearby props
        for (var propName in location.props) {
            var prop = env.props[propName]
          //  if (prop.location == env.location) {
                output += "You see a " + propName + ".\n"
           // }
        }

        // describe nearby users
        for (var userID in env.users) {
            var user = env.users[userID];
            if (user.location == location && (userID != system.stream.userID)) {
                output += "You see " + user.name + ".\n"
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

parser.addCommand('setDesc')
    .set('syntax', ['setDesc <string:desc*>'])
    .set('logic', function (args, env, system) {
        var location = env.users[system.stream.userID].location;
        env.locations[location].description = args['desc*'];
        return "OK."
    });



parser.addCommand('createRoom')
    .set('syntax', ['createRoom <string:roomname>'])
    .set('logic', function (args, env, system) {
        var loc = new Location();
        loc.description = "test description";
        loc.name = args.roomname;
        env.locations[args.roomname] = loc;
        env.users[system.stream.userID].location = args.roomname;
        return "room created.";
    });

parser.addCommand('saveLocation')
    .set('syntax', ['saveLocation'])
    .set('logic', function (args, env, system) {
        var userLocation = env.users[system.stream.userID].location;
        var location = env.locations[userLocation];
        mud.saveLocation(location);
        return "room saved.";
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
