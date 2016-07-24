var express = require('express');
const exec = require('child_process').exec;
var startOpts = {
	cwd: "Pokemon"
}
var bodyParser = require('body-parser');
var app = express();
var sql = require('sqlite3').verbose();
var db = new sql.Database("Pokemon/pogom.db");
global.servers = [];
// {

// 	length : 0,
// 	list: [],
// 	add : function(key, item){
// 		this.list[key] = item;
// 		this.length++;
// 	},
// 	remove : function(key){
// 		this.list.forEach(function(item, index){
// 			if(item)
// 		})
// 		this.length--;
// 	}
//};

var ejs = require('ejs');

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

app.use(express.static(__dirname + '/public'));

var ServerPort = 80;

app.get('/', function(req, res) {
	res.render('index');
})

app.post('/ping', function(req, res) {
	var count = 0;
	var found = false;
	id = req.body['id'];
	console.log("Updaing session for " + id);
	global.servers.forEach(function(item, index) {
		if (item.pid === id) {
			item.ping = new Date().getTime();
			found = true;
		}
		count++;
		if (global.servers.length == count) {
			return pingResult(res, found, id);
		}
	});
	return pingResult(res, found, id);
});

function pingResult(res, found, id) {
	if (found) {
		res.end("true");
	} else {
		console.log("Server not found for " + id + ". Attemting to start one.");
		startServer(id);
		res.end("false");
	}
}

app.post('/map', function(req, res) {

	var location = req.body["location-input"]
	lat = location.split(', ')[0];
	lon = location.split(', ')[1];
	id = new Buffer(location).toString("base64");

	startServer(id);

	res.render('map', {
		lat: lat,
		lng: lon,
		gmaps_key: "AIzaSyDF6s56OydakNTp9Di6fT3WAtUY-csN5lc",
		lang: "en"
	});
});

app.get('/raw_data', function(req, res) {
	var obj = {};
	obj.pokemons = [];
	db.each("SELECT * FROM POKEMON where disappear_time > datetime('now')", function(err, row) {
			if (!err)
				obj.pokemons.push(row);
		},
		function(err) {
			res.end(JSON.stringify(obj));
		});
});

function startServer(id) {

	//get the location from the id
	var location = new Buffer(id, 'base64').toString('utf8');
	//start the process
	console.log('Starting server with ID ' + id);
	var cmd = 'python runserver.py -a ptc -u pdutley -p xtsZV32SMcZj -l "' + location + '" -st 10 -ns -k AIzaSyDF6s56OydakNTp9Di6fT3WAtUY-csN5lc';
	console.log('Server start command ' + cmd);
	global.servers.push({
		pid: id,
		ping: new Date().getTime(),
		process: exec(cmd, startOpts, function(err, stout) {
			if (err) {
				console.log("Server exited with the following error " + err);
			}
		})
	});
}

function listServers() {
	cur = new Date().getTime();
	global.servers.forEach(function(item, index) {
		console.log("Current time: " + cur + " Server expires: " + (item.ping + 15000));
		if (item.ping + 15000 < cur) {
			console.log("Server " + item.pid + " session has expired");
			item.process.kill();
			killProcess(item.process);
			console.log(item.process);
			global.servers.splice(index, 1);
			return;
		}
	});
	console.log("There are " + global.servers.length + " server(s) running");
}

function killProcess(ps) {
	os = require('os');
	if (os.platform() === 'win32') {
		exec('taskkill /pid ' + ps.pid + ' /T /F');
	} else {
		ps.kill();
	}
}

app.listen(ServerPort);
setInterval(listServers, 5000);