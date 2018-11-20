var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.lastPlayerID = 0;

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

let bases = {};
let interval;
let base;

// Need to add a function that generates this list based on an algorithm which takes a 
// tile size of the base that is spawning and will spit out clockwise tiles offsets for 
// potential spawn locations
const spawnKeys = [{x:1,y:0}, {x:1,y:1}, {x:0,y:1}, 
	{x:-1,y:1}, {x:-1,y:0}, {x:-1,y:-1}, 
	{x:0,y:-1}, {x:1,y:-1}, {x:2,y:-1}, {x:2,y:0}, 
	{x:2,y:1}, {x:2,y:2}, {x:1,y:2}, {x:0,y:2}, {x:-1,y:2}, {x:-2,y:2}, {x:-2,y:1},
	{x:-2,y:0}, {x:-2,y:-1}, {x:-2,y:-2}, {x:-1,y:-2}, {x:0,y:-2}, {x:1,y:-2}, {x:2,y:-2},
	{x:3,y:-2}, {x:3,y:-1}, {x:3,y:0}];

function Base(baseConfig) {
	this.id = baseConfig.id;
	this.race = baseConfig.race;
	this.position = baseConfig.position;
	this.spawnMap = new Map();
	this.nextUnitId = 0;
	this.units = {};
	this.type = 'Base';
}

Base.prototype.addUnit = function(){
	const unitId = this.nextUnitId++;
	const spawnLoc = this.getNextSpawnLoc();
	const unit = {
		id:unitId,
		baseId:this.id,
		type:this.race,
		x:spawnLoc.x,
		y:spawnLoc.y,
		offset: 12,
	};
	this.units[unitId] = unit 
	//console.log(this.units);
	return unit;
}

Base.prototype.getNextSpawnLoc = function(){
	let key;
	const spawnMap = this.spawnMap;
	for (let i = 0; i < spawnKeys.length; i++) {
		key = spawnKeys[i];
		if (!spawnMap.get(key)) {
			spawnMap.set(key, true);
			break;
		}
	};
	const nextSpawnLoc = {
		x: this.position.x + key.x, 
		y: this.position.y + key.y
	}; 
	return nextSpawnLoc;
}

// determined bynumber of players in room?
const basesConfig = [
	{
		id:1,
		race:'red',
		position:{x:2,y:2}, 
		spawnLoc:{x:3,y:2},
	}
];

io.on('connection', function(socket) {
	console.log('User connected');
	socket.on('createBases', function() {
		// for now lets just have 1 base generate 1 red dino to the right
		// bases = generateBases(basesConfig);
		// base = basesConfig[0]
		// base.units = [];
		// base.type = 'Base';
		base = new Base(basesConfig[0]);
		io.emit('createBases', base);
		interval = setInterval(function(){
			addUnits();
		}, 2000);

		//socket.player = {
		//	id: server.lastPlayerID++,
		//	x: randomInt(100, 400),
		//	y: randomInt(100,400)
		//};
		//socket.emit('allplayers', getAllPlayers());
		//socket.broadcast.emit('newplayer', socket.player);

		//socket.on('click', function(data) {
		//	console.log('click to ' + data.x + ', ' + data.y);
		//	socket.player.x = data.x;
		//	socket.player.y = data.y;
		//	io.emit('move', socket.player);
		//});

		
	});

	socket.on('disconnect', function(){
			console.log('user disconnected');
			clearInterval(interval);
			// todo-ken will be needed for actions in lobby and
			// player dc, io.emit('remove', socket.player.id);
		});
});

function addUnits() {
	//bases.forEach(function(base){
		console.log('adding units');
		const unit = base.addUnit();
		console.log(unit);
		io.emit('addUnit', unit);
	//});
}

function generateBases(basesConfig) {
	basesConfig.forEach(function(config){
		console.log(new Base(config));
		bases.push(new Base(config));
	});
} 

// function getAllPlayers() {
// 	var players = [];
// 	Object.keys(io.sockets.connected).forEach(function(socketID) {
// 		var player = io.sockets.connected[socketID].player;
// 		if(player)
// 			players.push(player);
// 	});
// 	return players;
// }

function randomInt(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}