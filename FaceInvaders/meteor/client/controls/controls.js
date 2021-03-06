function Controls (game) {
  this.game = game;
  this.keyboard;
  this.mouse;
  this.bug;
  this.showingBugDialog = false;

  var el = this.el = $("<div>");
  el.addClass("Controls");
  el.css("height", game.consoleHeight+"px");
  game.el.append(el);

  var toggle = $("<div>");
  toggle.addClass("Toggle");
  toggle.css("display", "none");
  el.append(toggle);

  var doc = $(document);

  // Show mouse/keyboard control toggles when we know there is a mouse about.
  doc.one("mousemove", function (e) {
    // iOS sends mousemoves on input elements.
    var tag = e.target.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT")
      return;
    toggle.css("display", "");
  });

  // Make button clicks work on touch and prevent them from triggering fire.
  doc.on({
    click: function (e) {
      e.stopPropagation();
    },
    touchstart: function (e) {
      e.preventDefault();
      e.stopPropagation();
    },
    touchend: function(e) {
      // FIXME: Touches that did not end on their original element should not trigger click behavior.
      $(e.currentTarget).trigger("click", e.data);
      e.preventDefault();
      e.stopPropagation();
    },
    touchmove: function (e) {
      e.preventDefault();
      e.stopPropagation();
    },
    touchcancel: function (e) {
      e.preventDefault();
      e.stopPropagation();
    },
  }, ".Button");

  // Always enable all ways to toggle the debug display.
  doc.on({
    keydown: function (e) {
      // Toggle display console on ctrl-d
      if (e.which == 68 && e.originalEvent.ctrlKey) {
        e.data.game.debugDisplay.toggle();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    touchstart: function (e) {
      if (e.originalEvent.touches.length === 4) {
        // If each touch is in a corner, then toggle the debug menu
        var win = $(window);
        var w = win.width();
        var h = win.height();
        var top = h * 0.25;
        var bottom = h - top;
        var left = w * 0.25;
        var right = w - left; 
        function whichCorner(pageX, pageY) {
          if (pageX < left) {
            if (pageY < top)
              return 0;
            if (pageY > bottom)
              return 2;
          } else if (pageX > right) {
            if (pageY < top)
              return 1;
            if (pageY > bottom)
              return 3;
          }
          return 4;
        }
        var corners = [false, false, false, false, true];
        var touches = e.originalEvent.touches;
        for (var i in touches) {
          var touch = touches[i];
          var corner = whichCorner(touch.pageX, touch.pageY);
          corners[corner] = true;
        }
        if (corners[0] && corners[1] && corners[2] && corners[3]) {
          e.data.game.debugDisplay.toggle();
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    }
  }, null, this);

  var that = this;
  var keyboard = this.keyboard = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleKeyboard Button"),
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
        doc.off("keydown", me.onkeydown);
        doc.off("keyup", me.onkeydown);
      }
    }
  };
  keyboard.el.click(this, keyboard.toggle);

  var mouse = this.mouse = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleMouse Button"),
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

      e.preventDefault();
      e.stopPropagation();
    }
  };
  mouse.el.click(this, mouse.toggle);

  var bug = this.bug = {
    el: $("<div class='BugButton Button'>").appendTo(el).click(function (e) {
      that.reportBug();
    }),
  };

  new ControlsPopover(game, keyboard.el, "Left/right keys to move, space to shoot.");
  new ControlsPopover(game, mouse.el, "Move mouse to move, click to shoot.");
  new ControlsPopover(game, bug.el, "Report a bug.");

  // Turn 'em all on!
  keyboard.el.click();
  mouse.el.click();

  // Some Primitive-ass Touch Event Handlers
  var fireTimeout = 250;
  var timedMove = null;

  doc.on("touchstart", this, function (e) {
    var game = e.data.game;
    game.lastTouchStart = (new Date()).getTime();
    var player = e.data.game.player;
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    timedMove = setTimeout(function () {
      player && player.goto(touch.pageX); 
      timedMove = null;     
    }, fireTimeout);
  });
  doc.on("touchmove", this, function (e) {
    e.preventDefault();
    var player = e.data.game.player;
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    player && player.goto(touch.pageX);
  });
  doc.on("touchend", this, function (e) {
    e.preventDefault();
    var game = e.data.game;
    var player = game.player;
    var since = (new Date()).getTime() - game.lastTouchStart;
    if (since < fireTimeout) {
      player && player.fire();
      if (timedMove) {
        clearTimeout(timedMove);
        timedMove = null;
      }
    }
    if (!e.originalEvent.touches.length)
      player && player.stop();
  });

  // Universal game controls
  $(document).on("keydown", this, function (e) {
    // Pressing ctrl-p pauses the game
    if (e.which == 80 && e.originalEvent.ctrlKey)
      e.data.game.togglePause();
  });
};

Controls.prototype.reportBug = function () {
  if (this.showingBugDialog)
    return;
  if (!this.game.pause)
    this.game.togglePause();

  var that = this;

  this.showingBugDialog = true;
  var dialog = this.bugDialog = new ModalDialog(this.game.world.el, "Cancel", function () {
    that.showingBugDialog = false;
    that.game.togglePause();
  });
  dialog.addButton("Send", function () {
    Repro.reportIssue(title.val(), repro.val());
    dialog.dismiss();
  });

  dialog.el.append($("<div class='Label'>What's the problem?</div>"));
  var title = $("<input>").attr({
    "placeholder": "e.g. Player doesn't move after shooting.",
    "maxlength": 100}
  );
  dialog.el.append(title);

  dialog.el.append($("<div class='Label'>What did you do right before encountering this problem?</div>"));
  var repro = $("<textarea>").attr("placeholder", "e.g. I just started level 3, and pressed space to shoot the left-most enemy. I can always reproduce the problem following these steps.");
  repro.css("min-height", "200px");
  dialog.el.append(repro);
}

function ControlsPopover (game, anchorElement, content) {
  this.anchor = anchorElement;
  this.el = $("<div class='ControlsPopover'>");
  this.leftAlign = anchorElement.offset().left < $(window).width() / 2;
  if (!this.leftAlign)
    this.el.addClass("Right");

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
      left: that.leftAlign ? anchorOffset.left : "",
      right: !that.leftAlign ? game.el.innerWidth() - anchorOffset.left - anchorElement.width() : "",
    });
  }
  var eventsMap = {
    mouseover: show,
    mouseout: hide,
    touchstart: show,
    touchenter: show,
    touchexit: hide,
    touchend: hide,
    touchcancel: hide,
  };
  this.anchor.on(eventsMap);
}