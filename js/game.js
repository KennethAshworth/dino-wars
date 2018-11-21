var Game = {
    bases: {},
    clickPosition: { start: {}, end: {} },
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
    //Client.askNewPlayer();
    Client.createBases();

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('dino-red', {start:0, end: 3}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('dino-red', {start:4, end: 9}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'attack',
        frames: this.anims.generateFrameNumbers('dino-red', {start:10, end: 13}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('dino-red', {start:14, end: 16}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'dash',
        frames: this.anims.generateFrameNumbers('dino-red', {start:17, end: 22}),
        frameRate: 10,
        repeat: -1
    });

    // selection setup
    var graphics = this.add.graphics();
    var color = 0xffff00;
    var thickness = 2;
    var alpha = 1;

    var draw = false;
    this.input.on('pointerdown', function (pointer) {
        draw = true;
    });

    this.input.on('pointerup', function (pointer) {
        draw = false;
        graphics.clear();
        if (pointer.downX != pointer.x && pointer.downY != pointer.y)
            Game.getUnitsInSelection(pointer);
    });

    this.input.on('pointermove', function (pointer) {
        if (draw)
        {
            graphics.clear();
            graphics.lineStyle(thickness, color, alpha);
            graphics.strokeRect(pointer.downX, pointer.downY, pointer.x - pointer.downX, pointer.y - pointer.downY);
        }
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
    const spriteCoord = Game.getSpriteCoord(unit.x, unit.y, unit.offset);
    // todo: i think I need to add a collider generator for the new sprite phsyics body
    //      to compare against all other units in the game (currently ony this base)
    Game.createRedDino(spriteCoord, unit);
};

Game.createRedDino = function(coord, unit) {
    // todo: need to generate this sprite from the physics dynamic factory instead
    //      so that I can use the phsyics body for movement and colliding
    let sprite = Game.scene.add.sprite(coord.x, coord.y, 'dino-red');
    sprite.anims.play('idle', true);
    unit.sprite = sprite;
    Game.addUnitToBase(unit); 
};

Game.getUnitsInSelection = function(pointer) {
    // selected off the base of the socketId, use 1 for now

    // todo: need to save the current selection set in Game and
    //      clean it out on the pointermove event when draw is true
    let units = Game.bases[1].units;
    for(var i = 0; i < Object.keys(units).length; i++) {
        Game.isUnitInSelection(units[i], pointer);
    }
};

Game.isUnitInSelection = function(unit, p) {
    var largeX, smallX, largeY, largeX;
    largeX = p.x > p.downX ? p.x : p.downX
    smallX = p.x < p.downX ? p.x : p.downX
    largeY = p.y > p.downY ? p.y : p.downY
    smallY = p.y < p.downY ? p.y : p.downY
    const spriteCoord = Game.getSpriteCoord(unit.x, unit.y, unit.offset) 

    if (spriteCoord.x > smallX && spriteCoord.x < largeX && 
            spriteCoord.y > smallY && spriteCoord.y < largeY) {
        unit.sprite.alpha = 0.5;
    }
    //Game.addUnitToBase(unit);
};

Game.addUnitToBase = function(unit) {
    Game.bases[unit.baseId].units[unit.id] = unit
};

Game.getSpriteCoord = function(x, y, offset) {
    const tileCoord = Game.getMapCoord(x, y) 
    const spriteX = tileCoord.x + offset;
    const spriteY = tileCoord.y + offset;   
    return { x: spriteX, y: spriteY };
};

Game.getMapCoord = function(x, y) {
    const mapX = Math.floor(x*24);
    const mapY = Math.floor(y*24);
    return { x: mapX, y:mapY };
}


// ************* OLD **************************
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