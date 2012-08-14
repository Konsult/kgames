function Effects (game) {
  this.game = game;
  // Add Effects Layer to World?
  // Handle all complex animation states
};
Effects.prototype.createExplosion = function (x, y, callback) {
  var game = this.game;
  var duration = 500;

  var el = $("<div>").addClass("Explosion").appendTo(game.el);
  el.css("left", x+"px").css("top", y+"px");

  var callbackFunction = callback;
  setTimeout(function () {
    el.remove();
    if (callbackFunction)
      callbackFunction();
  }, duration);
};
Effects.prototype.createExplosionWithDelay = function (x, y, callback, delay) {
  var sameX = x;
  var sameY = y;
  var samelCallback = callback;
  var that = this;
  setTimeout(function () {
    that.createExplosion(sameX, sameY, samelCallback);
  }, delay);
};