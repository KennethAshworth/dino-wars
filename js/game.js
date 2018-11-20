var Game = {
    bases: {}
};

Game.init = function(){
    //this.stage.disableVisibilityChange = true;
};

Game.preload = function() {
    this.load.tilemapTiledJSON('map', 'assets/map/test.json');
    this.load.spritesheet('tileset', 
        'assets/map/grass-tiles-2-small.png', 
        { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('dino-red', 
        'assets/sprites/DinoSprites-red.png',
        { frameWidth: 24, frameHeight: 24 }
    );
};

Game.create = function(){
    Game.bases = {};
    Game.scene = this;
    const map = this.add.tilemap('map');
    const tileset = map.addTilesetImage('grass-tiles-2-small', 'tileset'); // tilesheet is the key of the tileset in map's JSON file
    layer = map.createStaticLayer('Tile Layer 1', tileset, 0, 0);
    layer.inputEnabled = true; // Allows clicking on the map
    //layer.events.onInputUp.add(Game.getCoordinates, this);
    //Client.askNewPlayer();
    Client.createBases();
    // 0-3 idle
    // 4-9 run
    // 10-13 attack
    // 14-16 die
    // 17-22 dash

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('dino-red', { start:0, end: 3}),
        frameRate: 10,
        repeat: -1
    });
};

Game.update = function() {
    // if (Game.bases[1] != undefined && Game.bases[1].units[0] != undefined) {
    //     console.log(Game.bases[1].units);
    //     const sprite = Game.bases[1].units[0];
        // playAnAnimation
    // }
};

Game.addBase = function(base) {
    Game.bases[base.id] = base;
};

Game.addUnit = function(unit) {
    const tileCoord = Game.getMapCoord(unit.x, unit.y); 
    const spriteX = tileCoord.x + unit.offset;
    const spriteY = tileCoord.y + unit.offset;
    let sprite = Game.scene.add.sprite(spriteX, spriteY, 'dino-red');
    sprite.anims.play('idle', true);    
    Game.bases[unit.baseId].units[unit.id] = sprite;
};

Game.getMapCoord = function(x, y) {
    const mapX = Math.floor(x*24);
    const mapY = Math.floor(y*24);
    return { x: mapX, y:mapY };
}


// OLD
Game.addNewPlayer = function(id, x, y) {
    Game.playerMap[id] = game.add.sprite(x, y, 'sprite');
};

Game.removePlayer = function(id) {
    Game.playerMap[id].destroy();
    delete Game.playerMap[id]
};

Game.getCoordinates = function(layer, pointer) {
    Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.movePlayer = function(id, x, y) {
    var player = Game.playerMap[id];
    var distance = Phaser.Math.distance(player.x, player.y, x, y)
    var duration = distance*5;
    var tween = game.add.tween(player);
    tween.to({x:x, y:y}, duration);
    tween.start();
}