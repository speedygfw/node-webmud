var config = require("./config");
var fs = require("fs");

var yaml = require('js-yaml');

// Get array of documents, or throw exception on error



var mud = {}
mud.locations = {}
mud.props = {}
mud.commands = {}


mud.location_dir = "public/locations/";
mud.props_dir = "public/props/";
mud.commands_dir = "public/commands/";

mud.Location = function Location(){}


mud.loadLocations = function()
{
    var files = fs.readdirSync(mud.location_dir);
    for (var fname in files) {
        var tmp = JSON.parse(fs.readFileSync(mud.location_dir + files[fname], 'utf8'));
        mud.locations[tmp.name] = tmp;
        //console.log(tmp.name);
    }

}

mud.loadProps = function()
{
    var files = fs.readdirSync(mud.props_dir);
    for (var fname in files) {
        var tmp = JSON.parse(fs.readFileSync(mud.props_dir + files[fname], 'utf8'));
        mud.props[tmp.name] = tmp;
        //console.log(tmp.name);
    }
}

mud.saveLocation = function(obj)
{
    fs.writeFile(mud.location_dir + obj.name + ".json", JSON.stringify(obj), function (err) {
        if (err) throw err;
        console.log('Location saved! : ' + mud.location_dir + obj.name + ".json");
    });
}

mud.removeLocation = function(id)
{
    fs.unlink(mud.location.dir + id + ".json");
}

mud.loadCommands = function(parser)
{
    var files = fs.readdirSync(mud.commands_dir);
    for (var fname in files) {
        var hcommand = yaml.load(fs.readFileSync(mud.commands_dir + files[fname], 'utf8'));
        parser.addCommand(hcommand.name)
            .set('syntax', hcommand.syntax)
            .set('logic', hcommand.logic);

        mud.locations[hcommand.name] = hcommand;
        //console.log(tmp.name);
    }
}



module.exports = mud;

