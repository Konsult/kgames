// Requires: jQuery, Underscore, Meteor.http

Meteor.startup(function () {
  Backbone.history.start({pushState: true});

  var el = $(document.body);
  window.app = new Game(el);
});
