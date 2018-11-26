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
    let selectedUnits = {}; 
    this.input.on('pointerdown', function (pointer) {
        draw = true;
    });

    this.input.on('pointerup', function (pointer) {
        draw = false;
        selectedUnits = Game.bases[1].selectedUnits == undefined ? 0 : Game.bases[1].selectedUnits;
        graphics.clear();
        if (pointer.downX !== pointer.x && pointer.downY !== pointer.y) {
            Game.bases[1].selectedUnits = Game.getUnitsInSelection(pointer);
        }
        else if (pointer.downX === pointer.x && pointer.downY === pointer.y && 
            Game.keyLength(selectedUnits) > 0)
        {
            Game.loopKeys(selectedUnits, function(id){
                const unit = selectedUnits[id];
                Game.scene.physics.accelerateTo(unit.sprite, pointer.x, pointer.y, 100, 100, 100);
            })
        }
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
    // check if any sprites positins have a speed if so update server units with that data
    
    // for each base in
    if (Game.bases[1] && Game.keyLength(Game.bases[1].units) > 0)
    {
        let movingUnits = Game.getUnitsMoving(Game.bases[1].units);
        
        if (Game.keyLength(movingUnits) > 0) {
            Client.updateUnits(movingUnits);
        }
    }
};


// Utility Functions
Game.loopKeys = function(obj, cb) {
    Object.keys(obj).forEach(cb);
}

Game.keyLength = function(object) {
    return Object.keys(object).length;
}

// Unit Functions
Game.getUnitsMoving = function(units) {
    let movingUnits = {};
    Game.loopKeys(units, function(id) {
        let unit = units[id];
        if (Game.isSpriteMoving(unit.sprite)) {
            movingUnits[unit.id] = unit;
        }
    })
    return movingUnits
}

Game.isSpriteMoving = function(sprite) {
    if(sprite.body.speed != 0)
        return true;
}

Game.addUnit = function(unit) {
    // done: i think I need to add a collider generator for the new sprite physics body
    //      to compare against all other units in the game (currently ony this base)
    Game.createRedDino(unit);
    Game.addCollidersToUnit(unit);
    Game.addUnitToBase(unit);
};

Game.createRedDino = function(unit) {
    let sprite = Game.scene.physics.add.sprite(unit.position.x, unit.position.y, 'dino-red');
    sprite.anims.play('idle', true);
    unit.sprite = sprite;
};

Game.addCollidersToUnit = function(unit) {
    // so do we only need 1 collider between x and y game object? but y to x is not needed?
    // adding colliders before unit addUnitToBase is called
    let units = Game.bases[1].units;
    for(var i = 0; i < Object.keys(units).length; i++) {
        Game.scene.physics.add.collider(unit.sprite, units[i].sprite);
    }
};

Game.getUnitsInSelection = function(pointer) {
    // selected off the base of the socketId, use 1 for now
    let selectedUnits = {};
    Game.resetSelectedUnits();
    // todo: need to save the current selection set in Game and
    //      clean it out on the pointermove event when draw is true
    let units = Game.bases[1].units;
    Game.loopKeys(units, function(id){
        const unit = units[id];
        if (Game.isUnitInSelection(unit, pointer))
            selectedUnits[unit.id] = unit;
    });
    return selectedUnits;
};

// todo-ken: very similar to isUnitInTile on server side might be able to create a 
// more abstract method
Game.isUnitInSelection = function(unit, p) {
    var largeX, smallX, largeY, largeX;
    largeX = p.x > p.downX ? p.x : p.downX
    smallX = p.x < p.downX ? p.x : p.downX
    largeY = p.y > p.downY ? p.y : p.downY
    smallY = p.y < p.downY ? p.y : p.downY

    if (unit.position.x > smallX && unit.position.x < largeX && 
            unit.position.y > smallY && unit.position.y < largeY) {
        Game.setUnitSpriteAsSelected(unit);
        return true;
    }
    else
    {
        return false;
    }
};

Game.resetSelectedUnits = function() {
    if (Game.bases[1].selectedUnits === undefined)
        return;
    let selectedUnits = Game.bases[1].selectedUnits;
    Game.loopKeys(selectedUnits, function(id){
        Game.setUnitSpriteAsUnselected(selectedUnits[id]);
    });
    Game.bases[1].selectedUnits = {};
}

Game.setUnitSpriteAsSelected = function(unit) {
    unit.sprite.alpha = 0.5;
    return unit;
}

Game.setUnitSpriteAsUnselected = function(unit) {
    unit.sprite.alpha = 1.0;
    return unit;
}

Game.addUnitToBase = function(unit) {
    Game.bases[unit.baseId].units[unit.id] = unit
    if(unit.id === 4) {
        unit.sprite.setVelocityX(160);
        unit.sprite.anims.play('right', true);
    }
};


// Base Functions
Game.addBase = function(base) {
    Game.bases[base.id] = base;
};




// outdated, send coords for new units as px, might be needed in other contexts...
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