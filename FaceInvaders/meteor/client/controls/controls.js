function Controls (game) {
  this.game = game;
  this.keyboard;
  this.mouse;

  var el = this.el = $("<div>");
  el.addClass("Controls");
  el.css("height", game.consoleHeight+"px");
  game.el.append(el);

  var toggle = $("<div>");
  toggle.addClass("Toggle");
  el.append(toggle);

  var that = this;
  var keyboard = this.keyboard = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleKeyboard"),
    onkeydown: function (e) {
      var player = e.data.game.player;

      if (e.which == 32 && player)
        player.fire();
      if (e.which == 37 && player)
        player.goLeft();
      if (e.which == 39 && player)
        player.goRight();
    },
    onkeyup: function (e) {
      var player = e.data.game.player;

      if (e.which == 37 && player)
        player.stop();
      if (e.which == 39 && player)
        player.stop();
    },
    toggle: function (e) {
      var me = e.data.keyboard;
      var on = e.data.keyboard.on = !me.on;
      me.el.toggleClass("toggled");

      var doc = $(document);
      if (on) {
        doc.keydown(e.data, me.onkeydown);
        doc.keyup(e.data, me.onkeyup);
      } else {
        doc.off("keydown");
        doc.off("keyup");
      }
    }
  };
  keyboard.el.click(this, keyboard.toggle);

  var mouse = this.mouse = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleMouse"),
    onclick: function (e) {
      var player = e.data.game.player;
      player && player.fire();
    },
    onmove: function (e) {
      var player = e.data.game.player;
      player && player.goto(e.pageX);
    },
    toggle: function (e) {
      var me = e.data.mouse;
      var on = e.data.mouse.on = !me.on;
      me.el.toggleClass("toggled");

      var doc = $(document);
      if (on) {
        doc.click(e.data, mouse.onclick);
        doc.mousemove(e.data, mouse.onmove);
      } else {
        doc.off("click");
        doc.off("mousemove");
      }
    }
  };
  mouse.el.click(this, mouse.toggle);

  new ControlsPopover(keyboard.el, "Left/right keys to move, space to shoot.");
  new ControlsPopover(mouse.el, "Move mouse to move, click to shoot.");

  // Turn 'em all on!
  keyboard.el.click();
  mouse.el.click();

  // Some Primitive-ass Touch Event Handlers
  $(document).bind("touchstart", this, function (e) {
    e.preventDefault();
    var game = e.data.game;
    game.lastTouchStart = (new Date()).getTime();
  });
  $(document).bind("touchmove", this, function (e) {
    e.preventDefault();
    var player = e.data.game.player;
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    player && player.goto(touch.pageX);
  });
  $(document).bind("touchend", this, function (e) {
    e.preventDefault();
    var game = e.data.game;
    var player = game.player;
    var since = (new Date()).getTime() - game.lastTouchStart;
    if (since < 500) player && player.fire();
  });
};

function ControlsPopover (anchorElement, content) {
  this.anchor = anchorElement;
  this.el = $("<div class='ControlsPopover'>");

  if (content)
    this.el.append(content);

  var that = this;
  function hide () {
    that.el.remove();
  }
  function show () {
    var anchorOffset = that.anchor.offset();
    $("body").append(that.el);
    that.el.css({
      top: anchorOffset.top - that.el.outerHeight(true),
      left: anchorOffset.left,
    });
  }
  var eventsMap = {
    mouseover: show,
    mouseout: hide,
    touchdown: show,
    touchend: hide,
    touchcancel: hide,
  };
  this.anchor.on(eventsMap);
}