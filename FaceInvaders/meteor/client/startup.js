// Requires: jQuery, Underscore, Meteor.http

Meteor.startup(function () {
  Backbone.history.start({pushState: true});

  var optimalWidth = 1440;
  var deviceWidth = $(window).width();
  if (deviceWidth < optimalWidth) {
    // iPhone chokes on anything > 3 when going portrait -> landscape -> portrait.
    var deviceWidthRatio = 3;
    var desiredWidth = Math.min(deviceWidthRatio * deviceWidth, optimalWidth);
    var scale = (deviceWidth / desiredWidth).toFixed(2);
    $("meta[name=viewport]").attr("content", "width=" + desiredWidth + ", initial-scale=" + scale + ", maximum-scale=" + scale + ", user-scalable=no");
  }

  var el = $(document.body);
  window.app = new Game(el);
});
