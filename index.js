var express = require('express');
const exec = require('child_process').exec;
var startOpts = {
	cwd : "Pokemon"
}
var bodyParser = require('body-parser');
var app = express();
var sql = require('sqlite3').verbose();
var db = new sql.Database("Pokemon/pogom.db");
var servers = [];

var ejs = require('ejs');

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

app.use(express.static(__dirname + '/public'));

var ServerPort = 8080;

app.get('/', function(req, res){
	res.render('index');
})

// app.post('/ping', function(req, res) {
// 	console.log('Starting Go Map at ' + req.body["location-input"]);
// 	var host = "pandahomenet.asuscomm.com";
// 	var ip = "192.168.1.135";
// 	var port = getPort();
// 	if (port != 0) {
// 		exec('python runserver.py -a ptc -u pdutley -p xtsZV32SMcZj -l "' + req.body["location-input"] + '" -st 10 -H ' + ip + ' -P ' + port, options, function(err, stout, stderr) {
// 			currentPort--;
// 			if (err) {
// 				console.log('Child process exited with error code', err.code);
// 				return;
// 			}
// 			console.log("Go map exited.");
// 			return;
// 		});
// 		res.end('<html><head><META http-equiv="refresh" content="5;URL=http://' + host + ':' + port + '"></head><body>Redirecting you to your Pokemon Go map in 5 Second</body></html>');
// 	} else {
// 		res.end("I'm sorry, the server is currently full. Please try again later.");
// 	}

// });

app.post('/map', function(req, res){

	lat = req.body["location-input"].split(', ')[0];
	lon = req.body["location-input"].split(', ')[1];
	id = new Buffer(req.body["location-input"]).toString("base64");

	console.log(lat);
	console.log(lon);

	//start the process
	console.log('Starting server with ID ' + id);
	var cmd = 'python runserver.py -a ptc -u pdutley -p xtsZV32SMcZj -l "' + req.body["location-input"] + '" -st 10 -ns -k AIzaSyDF6s56OydakNTp9Di6fT3WAtUY-csN5lc';
	console.log('Server start command ' + cmd);
	servers[id] = exec(cmd, startOpts, function(err, stout){
		if(err){
			console.log("Server exited with the following error " + err);
		}
	});

	res.render('map', {
		lat:lat,
		lng:lon,
		gmaps_key:"AIzaSyDF6s56OydakNTp9Di6fT3WAtUY-csN5lc",
		lang:"en"
	});
});

app.get('/raw_data', function(req, res){
	var obj = {};
	obj.pokemons = [];
	db.each("SELECT * FROM POKEMON where disappear_time > datetime('now')", function(err, row){
		if(!err)
			obj.pokemons.push(row);
	},
	function(err){
		res.end(JSON.stringify(obj));
	});
});

function listServers(){
	console.log("There are " + servers.length + " server(s) running.");
}

app.listen(ServerPort);
setInterval(listServers, 5000);
