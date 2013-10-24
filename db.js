// dmaster: A web-based Doom server browser and REST API.
// Copyright (C) 2013  Alex Mayfield
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var q = require('q');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(':memory:');

db.on('open', function() {
	this.exec(
		'PRAGMA foreign_keys = ON;' +
		'CREATE TABLE servers(' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, address TEXT, port INT,' +
			'maxplayers INT, maxclients INT, password INT, iwad TEXT,' +
			'map TEXT, gametype TEXT, name TEXT, url TEXT, email TEXT, ' +
			'updated TEXT, UNIQUE (address, port) ON CONFLICT IGNORE' +
		');' +
		'CREATE TABLE players(' +
			'server_id INT, ping INT, score INT, team INT, spectator INT,' +
			'name TEXT, FOREIGN KEY(server_id) REFERENCES servers(id)' +
		');' +
		'CREATE TABLE pwads(' +
			'server_id INT, pwad TEXT,' +
			'FOREIGN KEY(server_id) REFERENCES servers(id)' +
		');'
	);
});
db.servers = function() {
	var defer = q.defer();
	this.all(
		'SELECT DISTINCT address, port, servers.name, map, maxplayers, ' +
		'(SELECT COUNT(*) FROM players WHERE players.server_id = servers.id AND spectator = 0) AS players ' +
		'FROM servers LEFT JOIN players ON servers.id = players.server_id '+
		'WHERE servers.updated IS NOT NULL ORDER BY players DESC, servers.name;',
		function(err, rows) {
			if (err) {
				defer.reject(err);
			} else {
				defer.resolve(rows);
			}
		}
	);
	return defer.promise;
}

module.exports = db;
