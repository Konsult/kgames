KGamesRouter = Backbone.Router.extend({
  routes: {
    "redirect/fb?:params": "handleRedirect"
  },
  handleRedirect: function (str) {
    // Parse out the code/state
    var params = {};
    var paramStrings = str.split("&");
    _.each(paramStrings, function (param) {
      var keyval = param.split("=");
      params[keyval[0]] = keyval[1];
    });

    // Clear out the redirect info
    this.navigate("/", {replace: true});

    // Send over zee codes
    Meteor.call("RegisterAuthCodeFB", params, function (e, r) {
      if (typeof e != "undefined" || !r) {
        console.log("Failed to register Facebook Auth Code.");
        return;
      }
    });
  },
  handleUnknown: function (url) {
    console.log(url);
  }
});

Router = new KGamesRouter();