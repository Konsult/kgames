var maxEnemyColumns = 8;
var maxEnemyRows = 4;
var maxFleetToWorldRatio = { width: 0.75, height: 0.75 };
var enemyWidth = 150;
var enemyHeight = 150;
var enemyClasses = ["tv", "nom", "cage"];

function Enemy (id, game) {
  var world = this.world = game.world;
  this.game = game;
  this.fireTimer = null;

  // Self State
  this.id = id;
  this.score = 100;
  this.fleet = null;
  this.w = enemyWidth;
  this.h = enemyHeight;
  this.state = "alive";

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second

  // DOM State
  this.el = $("<div>");
  this.el.addClass("Unit");
  this.el.addClass("Enemy");
  this.el.addClass(enemyClasses[Math.floor(Math.random() * enemyClasses.length)]);
  this.setSize(this.w, this.h);

  // Add face
  this.face = {};
  this.face.el = $("<div class='Face'>");
  this.el.append(this.face.el);

  // Add body
  var body = $("<div class='Body'>");
  this.el.append(body);

  this.loadUser();
};
Enemy.prototype.loadUser = function(ms) {
  var that = this;
  var user = this.user = this.game.apis.fb.friends[this.id];

  if (user) {
    that.face.el.css("background-image", "url("+user.pic_square+")");
    return;
  }

  FB.api(
    {
      method: 'fql.query',
      query: 'SELECT name, pic_square, uid FROM user WHERE uid='+that.id
    },
    function(response) {
      var user = that.user = response[0];
      that.face.el.css("background-image", "url("+user.pic_square+")");
    }
  );
};
Enemy.prototype.update = function(ms) {
  // If we hit the bottom, auto game over!
  var bottom = this.fleet.y + this.y + this.h;
  if (bottom >= this.world.h)
    this.game.gameOver();
};
Enemy.prototype.render = function() {
  var now = this.game.time;

  switch (this.state) {
    case "alive":
      break;
    case "dead":
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Enemy.prototype.die = function () {
  if (this.state == "dead") return;

  var game = this.game;
  game.score += this.score;
  this.fleet.numAlive--;
  this.fleet.stepInterval *= .9;

  var off = this.el.offset();
  var x = off.left + this.w/2;
  var y = off.top + this.h/2;

  this.el.remove();
  this.state = "dead";
  game.effects.createExplosion(x,y);
  delete this.fleet.ships[this.id];
};
Enemy.prototype.fire = function () {
  if (this.state == "dead") return;
  if (this.game.paused) return;

  this.el.addClass("Fire");
  var that = this;
  setTimeout(function () {
    that.el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Enemy", this.game);
  var x = this.w/2;
  b.fireFrom(this.el, x, this.h);
};
Enemy.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};
Enemy.prototype.moveTo = function(x,y) {
  this.x = x;
  this.y = y;
  this.el.css("top", this.y+"px");
  this.el.css("left", this.x+"px");
};

function Fleet (ids, game) {
  var world = this.world = game.world;
  var now = game.time;
  this.game = game;

  // FB Data
  this.ids = ids;

  // Self State
  this.score = 500;
  this.x = enemyWidth/2;
  this.y = enemyHeight/2;
  this.state = "alive";

  // Movement State
  this.moveType = "step"; // Move by steps
  this.stepLength = 10;   // 10px wide steps
  this.stepInterval = 500;
  this.maxStepInterval = 1000;
  
  this.stepDirection = "right";
  this.lastStep = now;

  // AI
  this.shotInterval = 1000;
  this.lastShot = now;

  // DOM State
  var el = this.el = $("<div>");
  this.el.toggleClass("Group");
  this.el.toggleClass("Fleet");

  // Construct Fleet
  var ships = this.ships = {};
  this.numAlive = this.ids.length;

  for (i in ids) {
    var id = ids[i];
    var ship = ships[id] = new Enemy(id, game);
    ship.fleet = this;
    el.append(ship.el);
  }

  world.el.append(this.el);
};
Fleet.prototype.setFormation = function(formation) {
  switch (formation.type) {
    case "rows":
      var perrow = formation.perrow;
      var colWidth = maxFleetToWorldRatio.width * this.world.w / maxEnemyColumns;
      this.w = colWidth * (perrow - 1) + enemyWidth;
      var rows = Math.ceil(this.numAlive / perrow);
      var rowHeight = maxFleetToWorldRatio.height * this.world.h / maxEnemyRows;
      this.h = rowHeight *  (rows - 1) + enemyHeight;
      this.setSize(this.w, this.h);

      var that = this;
      var x = 0; var y = 0;
      _.each(this.ships, function (ship) {

        ship.moveTo(x, y);
        if (x + ship.w > that.w - colWidth) {
          y += rowHeight;
          x = 0;
        } else {
          x += colWidth;
        }
      });
    break;
  }
};
Fleet.prototype.setSpeed = function(speed) {
  this.stepInterval = this.maxStepInterval * Math.pow(0.9, speed);
};
Fleet.prototype.takeHit = function(thing) {
  var game = this.game;

  var ship = _.find(this.ships, function (ship) {
    return game.collides(ship, thing);
  });
  ship && ship.die();
  return !!ship;
};
Fleet.prototype.update = function(ms) {
  if (this.state == "dead") return;
  if (this.game.winOrLose) return;

  // If all our ships die, blow ourselves up
  if (this.numAlive == 0) {
    this.die();
    return;
  }

  // If fleet is too big, make it smaller
  var tooWide = this.w > this.world.w * maxFleetToWorldRatio.width;
  var tooTall = this.h > this.world.h * maxFleetToWorldRatio.height;
  var repositionShip;
  if (tooWide || tooTall) {
    var oldWidth = this.w;
    var oldHeight = this.h;
    var newWidth = tooWide ? this.world.w * maxFleetToWorldRatio.width : this.w;
    var newHeight = tooTall ? this.world.h * maxFleetToWorldRatio.height : this.h;
    this.w = newWidth;
    this.h = newHeight;
    repositionShip = function (ship) {
      var ratioX = ship.x / (oldWidth - enemyWidth);
      var ratioY = ship.y / (oldHeight - enemyHeight);
      ship.moveTo(ratioX * (newWidth - enemyWidth), ratioY * (newHeight - enemyHeight));
    };
  }

  _.each(this.ships, function (ship, id, ships) {
    // Clear Dead Ships
    if (ship.state == "dead") {
      delete ships[id];
      return;
    }
    // Reposition ships if needed.
    if (tooWide || tooTall)
      repositionShip(ship);
  });

  // HACK: Ensure we don't fall off the side!
  var maxX = this.world.w - this.w;
  this.x = Math.min(maxX, this.x);

  // Take a step, if it's time
  var now = this.game.time;
  var since = now - this.lastStep;
  if (since > this.stepInterval) {
    this.lastStep = now;
    this.step();
  }

  // Update Remaining Ships
  _.invoke(this.ships, "update", ms);

  // Fire when ready
  since = now - this.lastShot;
  if (since > this.shotInterval) {
    this.lastShot = now;
    this.fire();
  }
};
Fleet.prototype.step = function () {
  var world = this.game.world;

  // Take the appropriate step
  if (this.stepDirection == "right") {
    if ((this.x+this.w+this.stepLength) > world.w) {
      this.stepDown();
      this.stepDirection = "left";
      return;
    }
    this.stepRight();
  } else {
    if ((this.x-this.stepLength) < 0) {
      this.stepDown();
      this.stepDirection = "right";
      return;
    }
    this.stepLeft();
  }
};
Fleet.prototype.fire = function () {
  var that = this;
  var timeToFire = Math.random() * 250;

  function fireWhenReady () {
    // FIXME: Do a truer pause so you can't shorten the delay by pausing the game.
    if (that.game.pause) {
      that.fireTimer = setTimeout(fireWhenReady, timeToFire);
      return;
    }
    var num = that.numAlive * Math.random();
    num = Math.round(num-0.5) + 1;

    for (var i = 0; i < that.ids.length; i++) {
      var id = that.ids[i];
      var ship = that.ships[id];
      if (!ship) continue;
      if (ship.state == "alive") num--;
      if (!num) { ship.fire(); return; }
    }
  }
  this.fireTimer = setTimeout(fireWhenReady, timeToFire);
};
Fleet.prototype.render = function() {
  var now = this.game.time;

  switch (this.state) {
    case "alive":
      this.el.css({
        left: this.x + "px",
        top: this.y + "px",
        width: this.w + "px",
        height: this.h + "px"
      });
      break;
    case "dead":
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Fleet.prototype.stepLeft = function () {
  this.x -= this.stepLength;
  this.x = Math.max(this.x, 0);
};
Fleet.prototype.stepRight = function () {
  this.x += this.stepLength;
  this.x = Math.min(this.x, this.world.w-this.w);
};
Fleet.prototype.stepDown = function () {
  this.y += (3 * this.stepLength);
  this.y = Math.min(this.y, this.world.h);
};
Fleet.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};
Fleet.prototype.die = function () {
  this.game.score += this.score;
  this.state = "dead";
  this.el.remove();
  delete this.world.enemies[this.id];
};