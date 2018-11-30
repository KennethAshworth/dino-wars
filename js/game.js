var Game = {
    bases: {},
    clickPosition: { start: {}, end: {} },
    DWGlobals: {
        mapTileSize: 6,
        unitTileSize: 24,
        movementTileSize: 4,
    },
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
        if ( Math.abs(pointer.downX - pointer.x) > 10 &&  Math.abs(pointer.downY - pointer.y) > 10) {
            Game.bases[1].selectedUnits = Game.getUnitsInSelection(pointer);
        }
        else if (Game.keyLength(selectedUnits) > 0)
        {
            Game.loopKeys(selectedUnits, function(id){
                const unit = selectedUnits[id];
                Game.setUnitToMoving(unit, pointer);
            });
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
            Game.loopKeys(movingUnits, function(id) {
                const unit = movingUnits[id];
                if (Game.unitIsWithinGoal(unit)) {
                    console.log('goal found');
                    Game.setUnitToStop(unit);
                }
            });
            // NOTE: remember that the position x/y on client side of unit is the original spawn location
            // updated x/y values must be retreived from sprite, however server side will have position of
            // x/y of unit updated to calculate additional spawn locations. In the future make it so
            // that the unit passed down for spawn creation is consumed by factory to generate
            // a new sprite unit without the x/y value on it client side, instead that will be a 
            // server specific value...? or should server also have a sprite level to store data... probally yes
            Client.updateUnits(movingUnits);
        }
    }
};


// Utility Functions
Game.loopKeys = function(obj, cb) {
    Object.keys(obj).forEach(cb);
};

Game.keyLength = function(object) {
    return Object.keys(object).length;
};

Game.generateTileGoal = function(pointer) {
    // currently tile set is same size as unit 24x24 px
    return Game.getTileCoord(pointer.x, pointer.y, Game.DWGlobals.unitTileSize);
};

// Unit Functions
Game.unitIsWithinGoal = function(unit) {
    const ts = Game.DWGlobals.unitTileSize;
    const body = unit.sprite.body
    const goal = unit.goal
    const result = Game.isEntityInRegion(body.x, body.y, goal.x, goal.x + ts, goal.y, goal.y + ts);
    return result;
};

Game.setUnitToMoving = function(unit, pointer) {
    unit.sprite.anims.play('dash', true);
    unit.sprite.body.setImmovable(false);
    // todo-ken: next is to use a smaller path finding tile and perform a* on this map set,
    // navigating to each node with accelerateTo
    // todo-ken: check if there is a vector object in phaser that can be used for local collision?
    unit.goal = Game.generateTileGoal(pointer); // <-- this needs to generate the path as well
    // todo-ken: this accelerateTo will probally work for locomotion as long as the nodes
    // along the path are defined and they continously accelerateTo a close by node

    // todo-ken: once the first unit in a formation has reached its goal (which needs to be updated to reflect the
    // new size of units that are pathing) then the other units in that formation will need to update their goals
    // to open tiles around the formation leader's position until a new order is given

    // also need to reduce the screen size to be mroe inline with mobile screensizes as well as 
    // start thinking about camera movement across the map as well as removing gameObjects from the rendering process
    // ie only render what is visible to the camera and have the server continue making the necessary calculations
    // for unit traversal... (with path spot checking, all units should be accounted for since each client will report its change 
    // in unit positions) The real question is the feasibilty of reducing rendering to camera view and if that is
    // enough to improve performance even though physic calculations still need to take place on all player's sprite bodies
    // whether or not they are on the camera.... However maybe just limiting the amount units that have to be rendered will
    // improve performance if screen size is reduced...

    Game.scene.physics.accelerateTo(unit.sprite, pointer.x, pointer.y, 1000, 40, 40);
}

Game.setUnitToStop = function(unit) {
    unit.sprite.anims.play('idle', true);
    unit.sprite.body.setImmovable(true);
    unit.sprite.body.setAcceleration(0, 0);
    unit.sprite.body.setVelocity(0, 0);
    unit.sprite.anims.play('idle', true);
}

Game.getUnitsMoving = function(units) {
    let movingUnits = {};
    Game.loopKeys(units, function(id) {
        let unit = units[id];
        if (Game.isSpriteMoving(unit.sprite)) {
            movingUnits[unit.id] = unit;
        }
    })
    return movingUnits
};

Game.isSpriteMoving = function(sprite) {
    if(sprite.body.speed != 0)
        return true;
};

Game.addUnit = function(unit) {
    // done: i think I need to add a collider generator for the new sprite physics body
    //      to compare against all other units in the game (currently ony this base)
    Game.createUnit(unit);
    Game.addCollidersToUnit(unit);
    Game.addUnitToBase(unit);
    console.log('unit count: ' + Game.keyLength(Game.bases[1].units));
};


Game.createUnit = function(unit) {
    let sprite = Game.scene.physics.add.sprite(unit.position.x, unit.position.y, unit.race);
    sprite.anims.play('idle', true);
    sprite.body.setImmovable(true);
    sprite.body.setSize(12, 12, false);
    sprite.body.setOffset(0, 6);
    unit.sprite = sprite;
};

Game.addCollidersToUnit = function(unit) {
    // so do we only need 1 collider between x and y game object? but y to x is not needed?
    // adding colliders before unit addUnitToBase is called
    let units = Game.bases[1].units;
    for(var i = 0; i < Object.keys(units).length; i++) {
        // todo-ken: need to add a callback on this collider because
        // units are now immovable which means there is no default physics reaction
        // so units need to separate naturally
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
    var largeX, smallX, largeY, largeX, unitX, unitY, result;
    largeX = p.x > p.downX ? p.x : p.downX
    smallX = p.x < p.downX ? p.x : p.downX
    largeY = p.y > p.downY ? p.y : p.downY
    smallY = p.y < p.downY ? p.y : p.downY
    unitX = unit.sprite.body.x;
    unitY = unit.sprite.body.y;
    result = Game.isEntityInRegion(unitX, unitY, smallX, largeX, smallY, largeY);
    if (result === true)
        Game.setUnitSpriteAsSelected(unit);
    
    return result;
};

Game.isEntityInRegion = function(entityX, entityY, x1, x2, y1, y2) {
    if (entityX > x1 && entityX < x2 && entityY > y1 && entityY < y2)
        return true;
    else
        return false;
};

Game.resetSelectedUnits = function() {
    if (Game.bases[1].selectedUnits === undefined)
        return;
    let selectedUnits = Game.bases[1].selectedUnits;
    Game.loopKeys(selectedUnits, function(id){
        Game.setUnitSpriteAsUnselected(selectedUnits[id]);
    });
    Game.bases[1].selectedUnits = {};
};

Game.setUnitSpriteAsSelected = function(unit) {
    unit.sprite.tint = 0x99ff99;
    return unit;
};

Game.setUnitSpriteAsUnselected = function(unit) {
    unit.sprite.tint = 0xffffff;
    return unit;
};

Game.addUnitToBase = function(unit) {
    Game.bases[unit.baseId].units[unit.id] = unit
};


// Base Functions
Game.addBase = function(base) {
    Game.bases[base.id] = base;
};

Game.getTileCoord = function(x, y, tileSize) {
    const tileX = Math.floor(x/tileSize) * tileSize;
    const tileY = Math.floor(y/tileSize) * tileSize;
    return { x: tileX, y:tileY };
};




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