function Game (pel) {
  var that = this;
  this.score = 0;
  this.level = 0;
  this.inplay = false;
  this.pause = false;

  // These are initialized later.
  this.winOrLose = null;
  this.endText = null;
  this.flybox = null;
  this.info = null;
  this.effects = null;
  this.balloon = null;
  this.pauseOverlay = null;

  // Load External APIs
  this.apis = {};
  var fb = this.apis.fb = new FacebookAPI(FB_APP_ID);
  fb.loadAsync();

  // App Size Constants
  this.consoleHeight = 80;

  // Create Game DOM Root
  var el = this.el = $("<div>");
  this.pel = pel.append(el);

  // Create debug console
  this.debugDisplay = new DebugDisplay();
  this.el.append(this.debugDisplay.el);

  // Create Game World
  var world = this.world = new World(this);
  var player = this.player = new Player(this);

  // Create Game Console
  var info = this.info = new InfoOverlay(this);
  // Don't show info overlay until game is initialized.
  info.el.css("display", "none");
  var controls = this.controls = new Controls(this);

  // Create Flying Message Box
  var flybox = this.flybox = $("<div>").addClass("LevelText").appendTo(this.el);
  flybox.title = $("<h1>").appendTo(flybox);

  // Create Effects Layer
  var effects = this.effects = new Effects(this);

  // On login/logout
  fb.statusChange(function () {
    if (fb.status == "in") {
      if (that.balloon) {
        that.balloon.die();
        delete that.world.enemies["LoginBalloon"];
      }
      that.balloon = null;
      that.player.load();
      that.info.el.css("display", "");

      // Check if they're a beta user
      that.checkBetaStatus();

      // Add start game balloon button so game doesn't auto-start if already logged in.
      var center;
      var balloon = new BalloonButton("Start<br>Game", function (e) {
        that.effects.createExplosion(center.left, center.top);
        delete that.world.enemies["StartBalloon"];
        that.startNextLevel();
      });
      that.world.el.append(balloon.el);
      var left = Math.random() * (that.world.w - balloon.el.outerWidth(true));
      var top = (that.world.h - balloon.el.outerHeight(true)) / 2;
      balloon.el.offset({ left: left, top: top, });
      center = {
        top: top + balloon.el.height() / 2,
        left: left + balloon.el.outerWidth(true) / 2,
      };
      that.world.enemies["StartBalloon"] = balloon;
    } else {
      that.balloon = new LoginBalloon(fb, that.world);
      that.world.enemies["LoginBalloon"] = that.balloon;
    }
  });

  this.launch();
};
Game.prototype.launch = function () {
  var that = this;
  that.time = (new Date()).getTime();

  // Set up Stats
  Stats.addScalar("launchTime", that.time);
  Stats.addEventSeries("frame");

  function loop () {
    // Kick of next loop
    that.raf = window.requestAnimationFrame(loop);

    // Set up time for this loop
    var now = (new Date()).getTime();
    var ms = now - that.time;
    that.time = now;

    // Update Stats
    Stats.recordEvent("frame");

    // Update everything
    that.update(ms);
    that.render();
  };
  loop();
};
Game.prototype.update = function (ms) {
  if (this.pause)
    return;

  var changeLevel = this.inplay && !_.find(this.world.enemies, function () {return true;});
  changeLevel && this.startNextLevel();

  this.player.update(ms);
  this.world.update(ms);
  this.info.update(ms);
};
Game.prototype.togglePause = function () {
  this.pause = !this.pause;

  if (this.pause && !this.pauseOverlay) {
    this.pauseOverlay = $("<div class='PauseOverlay'>Paused</div>");
    this.world.el.append(this.pauseOverlay);
  }
  this.pauseOverlay.css("display", this.pause ? "block" : "none");
}
Game.prototype.reset = function () {
  // Reset enemies
  var enemies = this.world.enemies;
  for (var enemy in enemies)
    enemies[enemy].el.remove();
  this.world.enemies = {};

  this.player.reset();

  // Reset game state
  this.score = 0;
  this.level = 0;
  this.inplay = false;
  this.pause = false;
  this.winOrLose = null;
  this.el.removeClass("Lose Win");
  if (this.endText) {
    this.endText.remove();
    this.endText = null;
  }

  this.inplay = true;
}
Game.prototype.render = function () {
  this.player.render();
  this.world.render();
  this.info.render();
};
Game.prototype.startNextLevel = function () {
  var game = this;
  game.inplay = false;

  var world = this.world;
  var player = this.player;
  var levelID = this.level++;

  // Setup Level Start Text
  var flybox = game.flybox;
  flybox.title.html("Level "+this.level);
  flybox.removeClass("in");
  flybox.removeClass("out");

  // Load Friends, if needed
  if (!game.apis.fb.friendIDs.length)
    this.apis.fb.getFriends();

  function onlevelload (error, result) {
    if (error) {
      alert("Failed to load level. Please report this problem by clicking the report bug button on the bottom right, thanks!");
      return;
    }
    if (!result) {
      console.log("No level returned from server, so let's just call it a day and let them win! :)");
      game.gameWon();
      return;
    }

    var level = result;
    flybox.addClass("in");

    function start() {
      if (game.inplay) return;
      if (!game.apis.fb.friendIDs.length) {
        setTimeout(start,100);
        return;
      }
      game.inplay = true;
      game.loadLevel(level);
      flybox.addClass("out");
    };
    setTimeout(start,2000);
  };

  Meteor.call("GetLevel", player.id, levelID, onlevelload);
};
Game.prototype.loadLevel = function (level) {
  var game = this;
  var world = this.world;

  // Creates an n-length list of random items from list
  function randomN(list, n) {
    var random = [];
    var len = list.length;
    for (var i = 0; i < n; i++) {
      var x = Math.random() * len - 0.5;
      x = Math.max(0, Math.min(x, len-1));
      x = Math.round(x);
      random.push(list[x]);
    }
    return random;
  };
  var ids = randomN(game.apis.fb.friendIDs, level.count);
  var fleet = new Fleet(ids, game);
  fleet.setFormation(level.formation);
  fleet.setSpeed(level.speed);
  fleet.id = "MainFleet";
  world.enemies[fleet.id] = fleet;
};
Game.prototype.checkBetaStatus = function () {
  var user = FB.getUserID();
  Meteor.call("IsBetaUser", user, function (e, r) {
    if (!e && !r)
      alert("Sorry, it appears that you're not currently on the beta users list. Please let us@konsu.lt know if you want to get on the list, thanks!");
  });
};
// If A and B collide
Game.prototype.collides = function (A, B) {
  var a = A.el; var b = B.el;

  // Currently assumes only DOM nodes' rects for collisions
  function left (x) { return x.offset().left };
  function right (x) { return left(x) + x.width(); };
  function top (x) { return x.offset().top; };
  function bottom (x) { return top(x) + x.height(); };

  return !(left(a) > right(b)
        || right(a) < left(b)
        || top(a) > bottom(b)
        || bottom(a) < top(b));
};
// If A contains B
Game.prototype.contains = function (A, B) {
  var a = A.el; var b = B.el;

  // Currently assumes only DOM nodes' rects for collisions
  function left (x) { return x.offset().left };
  function right (x) { return left(x) + x.width(); };
  function top (x) { return x.offset().top; };
  function bottom (x) { return top(x) + x.height(); };

  return (left(a) <= left(b)
        && top(a) <= top(b)
        && right(a) >= right(b)
        && bottom(a) >= bottom(b));
};
Game.prototype.gameOver = function () {
  if (!this.inplay) return;
  this.inplay = false;
  this.winOrLose = "Lose";

  var game = this;
  this.endText = createEndGameText(this, "You&nbsp;", "Lose", function () {
    game.el.addClass("Lose");
  });
}
var fireworkInterval = 2000;
var fireworkPositions = [
  {top: 0.5, left: 0.15},
  {top: 0.25, left: 0.25},
  {top: 0.15, left: 0.50},
  {top: 0.25, left: 0.75},
  {top: 0.5, left: 0.85},
]

Game.prototype.gameWon = function () {
  this.inplay = false;
  this.winOrLose = "Win";

  var that = this;
  this.endText = createEndGameText(this, "You&nbsp;", "Win!", function () {
    that.el.addClass("Win");

    function createFirework () {
      if (that.winOrLose !== "Win") {
        clearInterval(fireworkIntervalID);
        return;
      }

      var delay = 0;
      var delayStep = fireworkInterval * 0.75 / fireworkPositions.length;
      for(var i = 0; i < fireworkPositions.length; i++) {
        var pos = fireworkPositions[i];
        that.effects.createExplosionWithDelay(pos.left * that.world.w, pos.top * that.world.h, null, delay);
        delay += delayStep;
      }
    }

    createFirework();
    var fireworkIntervalID = setInterval(createFirework, fireworkInterval);

    // TODO: drop some bacon and eggs.
  });
}

function World (game) {
  this.game = game;
  this.enemies = {};
  this.bullets = {};

  var el = this.el = $("<div>").addClass("World").appendTo(game.el);
  // Add 1px to overlap images a little to prevent background color bleed.
  el.css("bottom", game.consoleHeight - 1 +"px");

  // Update Size w.r.t. the Viewport
  var that = this;
  function resizeToViewport() {
    that.w = $(window).width();
    that.h = $(window).height() - that.game.consoleHeight;
  }
  $(window).resize(resizeToViewport);
  resizeToViewport();

  // Foreground Layer
  this.el.append($("<div class='Foreground'>"));

  // Sky Layer
  var sky = $("<div class='RotatingSky'>").appendTo(el);
  sky.append($("<div class='Sun'>"));

  // Cloud Layer
  var clouds = $("<div class='CloudContainer'>").appendTo(el);
  for (var i = 0; i < 10; i++) {
    createCloud(clouds);
  }

  // Night Layer
  createNightSky(sky, 10);
};
World.prototype.update = function (ms) {
  function u(o) {o && o.update && o.update(ms);};
  _.each(this.enemies, u);
  _.each(this.bullets, u);
};
World.prototype.render = function () {
  function r(o) {o && o.render && o.render();};
  _.each(this.enemies, r);
  _.each(this.bullets, r);
};
