
// Add uncaught-exception handler in prod-like environments
if (geddy.config.environment != 'development') {
  process.addListener('uncaughtException', function (err) {
    geddy.log.error(JSON.stringify(err));
  });
}

mud = require('../../mud');
mud.location_dir = '../public/locations/';
mud.props_dir = '../public/props/';
mud.loadLocations();
mud.loadProps();
