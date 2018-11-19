var Client = {};
Client.socket = io.connect();

Client.createBases = function(){
	Client.socket.emit('createBases');
};

Client.socket.on('createBases', function(base){
	Game.addBase(base);
})

Client.socket.on('addUnit', function(unit){
	console.log(unit);
	Game.addUnit(unit);
});


// OLD
Client.askNewPlayer = function() {
	Client.socket.emit('newplayer');
};

Client.sendClick = function(x, y) {
	Client.socket.emit('click', {x:x, y:y});
}

Client.socket.on('newplayer', function(data){
	console.log(data);
	Game.addNewPlayer(data.id, data.x, data.y);
});

Client.socket.on('allplayers', function(data){
	for(var i= 0; i < data.length; i++) {
		Game.addNewPlayer(data[i].id, data[i].x, data[i].y);
	}
});

Client.socket.on('remove', function(id){
	Game.removePlayer(id);
});

Client.socket.on('move', function(data) {
	Game.movePlayer(data.id, data.x, data.y);
});
