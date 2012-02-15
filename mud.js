var config = require("./config");
var fs = require("fs");




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

mud.loadCommand = function()
{
    var tmp = JSON.parse(fs.readFileSync(mud.commands_dir + 'help.json', 'utf8'));
    return tmp;
}


module.exports = mud;

