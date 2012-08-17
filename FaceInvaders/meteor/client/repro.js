(function () {
  function Repro () {
    this.server = {
      url: "http://repro.konsu.lt:8080"
    };

    // Repro App Info
    this.appID = null;
    this.semver = null;

    // Repro App Settings
    this.settings = {
    };

    // User/Reporter Profile
    this.user = {
      id: null,
      type: null,
      name: null
    };
  };

  // Bootstraps Repro Infrastrure
  Repro.prototype.init = function (appID, semver) {
    this.appID = appID;
    this.semver = semver;
  };
  Repro.prototype.addFacebookUser = function (id, name) {
    this.user.type = "facebook";
    this.user.id = id;
    this.user.name = name;
  };
  Repro.prototype.reportIssue = function (title, body) {
    var user = this.user;
    var display = {
      width: screen.width,
      height: screen.height
    };
    // Bundle up issue
    var issue = {
      title: title,
      body: body,
      semver: this.semver,
      ua: navigator.userAgent,
      user: this.user,
      display: display
    };

    // HACK: json no parsey wah!
    issue.userid = user.id;
    issue.usertype = user.type;
    issue.username = user.name;
    issue.displayW = display.width;
    issue.displayH = display.height;

    var path = "/app/"+this.appID+"/issue";
    var url = this.server.url + path;
    $.post(url, issue, function (data, status) {
      console.log(data);
      console.log(status);
    }, "json");
  };

  // Basic System Profile
  Repro.prototype.profileSystem = function () {
    var sys = {
      ua: this.navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelDepth: screen.pixelDepth
      }
    };
  };
  Repro.prototype.runConfTests = function () {};
  Repro.prototype.runPerfTests = function () {};

  window.Repro = new Repro();
})();