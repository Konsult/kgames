function DebugDisplay () {
  this.el = $("<div class='DebugDisplay'>");
  this.isShown = false;
  this.el.css("display", "none");
  this.el.append("Debug Info here");
}

DebugDisplay.prototype.toggle = function () {
  if (this.isShown)
    this.hide();
  else
    this.show();
}

DebugDisplay.prototype.show = function () {
  this.el.css("display", "block");
  this.isShown = true;
}

DebugDisplay.prototype.hide = function () {
  this.el.css("display", "none");
  this.isShown = false;
}