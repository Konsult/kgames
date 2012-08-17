function DebugDisplay () {
  this.el = $("<div class='DebugDisplay'>");
  this.isShown = false;
  this.el.css("display", "none");
  this.text = $("<p>").html("Debug Info here");
  this.el.append(this.text);

  // Refresh Interval ID
  this.intervalID = null;
  this.interval = 500;
}

DebugDisplay.prototype.toggle = function () {
  if (this.isShown) this.hide();
  else this.show();
}

DebugDisplay.prototype.show = function () {
  this.el.css("display", "block");
  this.isShown = true;

  // Kick of Refresh Interval
  var that = this;
  this.intervalID = setInterval(function () {
    var fps = Stats.getStat("frame", "eps");
    fps = Math.round(fps * 10) / 10;
    var str = fps+" FPS";
    that.text.html(str);
  }, this.interval);
}

DebugDisplay.prototype.hide = function () {
  this.el.css("display", "none");
  this.isShown = false;
  clearInterval(this.intervalID);
}