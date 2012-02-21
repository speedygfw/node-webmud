
var Locations = function () {
  this.respondsWith = ['html', 'json', 'js', 'txt'];

  this.index = function (req, resp, params) {

    this.respond({params: params, locations: mud.locations});
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    // Save the resource, then display index page
    var exits = {"north" : params.north, "south": params.south, "west": params.west, "east": params.east};

    if(mud.locations[params.name])
    {
      mud.locations[params.name].description = params.description;
        mud.locations[params.name].exits = exits;
      mud.saveLocation(mud.locations[params.name]);

    }
      else
    {
    var loc = new mud.Location();
    loc.description = params.description;
    loc.name = params.name;
    loc.exits = exits;
    mud.saveLocation(loc);
    mud.locations[loc.name] = loc;
  }

    this.redirect({controller: this.name});
  };

  this.show = function (req, resp, params) {
    var loc = mud.locations[params.id];

    this.respond({location: loc});
  };

  this.edit = function (req, resp, params) {
    var loc = mud.locations[params.id];
    this.respond({location: loc});
  };

  this.update = function (req, resp, params) {
    // Save the resource, then display the item page
    this.redirect({controller: this.name, id: params.id});
  };

  this.remove = function (req, resp, params) {
    mud.removeLocation(params.id);
    this.respond({params: params});
  };

};

exports.Locations = Locations;

