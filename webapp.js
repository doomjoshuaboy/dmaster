var express = require('express');
var db = require('./db.js');

var webapp = express();

// App configuration
webapp.enable('trust proxy');

// App middleware
webapp.use(express.logger());
webapp.use(express.compress());
webapp.use('/static', express.static('static'));
webapp.locals.static = '/static/';

// Hogan templates
webapp.set('view engine', 'hgn');
webapp.set('layout', 'layout');
webapp.enable('view cache');
webapp.engine('hgn', require('hogan-express'));

// App routes
webapp.get('/', function(req, res) {
	res.redirect(301, '/servers');
});
webapp.get('/servers', function(req, res) {
	db.all(
		'SELECT DISTINCT servers.address, servers.port, servers.name, servers.map, servers.maxplayers, ' +
		'(SELECT COUNT(*) FROM players WHERE players.server_id = servers.id AND players.spec = 0) AS players ' +
		'FROM servers LEFT JOIN players ON servers.id = players.server_id '+
		'WHERE servers.updated IS NOT NULL ORDER BY players DESC;',
		function(err, rows) {
			if (err) {
				throw err;
			} else {
				res.locals = {servers: rows};
				res.render('servers');
			}
		}
	);
});
webapp.get('/servers/:address::port', function(req, res) {
	res.send('server');
});

// REST routes v1
(function(prefix) {
	webapp.get(prefix + '/servers', function(req, res) {
		db.all('SELECT * FROM servers WHERE updated IS NOT NULL;', function(err, rows) {
			res.send(rows);
		});
	});
	webapp.get(prefix + '/players', function(req, res) {
		db.all('SELECT * FROM players', function(err, rows) {
			res.send(rows);
		});
	});
	webapp.get(prefix + '/servers/:address::port', function(req, res) {
		var address = req.params.address;
		var port = req.params.port;

		db.get(
			'SELECT * FROM servers AS s ' +
			'WHERE s.address = ? AND s.port = ?;'
		, address, port, function(err, row) {
			if (row) {
				res.send(row);
			} else {
				res.send(404);
			}
		});
	});
})('/api/v1');

module.exports = webapp;
