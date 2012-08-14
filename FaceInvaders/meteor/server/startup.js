var FBAuths = new Meteor.Collection("FBAuths");
var FBUsers = new Meteor.Collection("FBUsers");
var BetaList = new Meteor.Collection("BetaList");

Meteor.startup(function () {
  for (i in BETA_LIST) {
    var userID = BETA_LIST[i];
    if (userIsOnBetaList(userID))
      continue;
    BetaList.insert({userID: userID});
  }
});

Meteor.methods({
  IsBetaUser: function (userID) {
    return userIsOnBetaList(userID);
  },
  GetLevel: function (userID, levelID) {
    // TODO: Consider disallowing here if they're not on the beta list a speedbump for unknown peeps.
    return Levels[levelID];
  },
  LoginServerSideFB: function (origin) {
    // Login with Facebook via OAuth2
    var url = "https://www.facebook.com/dialog/oauth/?";
    url += "client_id="+FB_APP_ID;

    // Tell Facebook to come back here
    var redirect = origin + "/redirect/fb";
    url += "&redirect_uri="+redirect;

    // Unique State ID issued by our servers
    var state = FBAuths.insert({status:"pending", redirect:redirect});
    url += "&state="+state;

    // Facebook Permissions
    var scope = "user_about_me,user_birthday,user_photos,email";
    url += "&scope="+scope;

    return {url:url};
  },
  RegisterAuthCodeFB: function (params) {
    var code = params.code;
    var state = params.state;
    var auth = FBAuths.findOne({_id:state});

    if (!auth) {
      console.log("Invalid FB State ID");
      return false;
    }

    // Get User Auth Token
    var result = getUserAccessToken(code, auth.redirect);
    if (result.statusCode == "400") {
      console.log("Failed to get FB User Access Token");
      return false;
    }
    var params = result.content.split("token=")[1].split("&expires=");
    var token = params[0];
    var expires = params[1];

    // Get User Info
    result = getUserInfo(token);
    if (result.statusCode == "400") {
      console.log("Failed to get FB User Info");
      return false;
    }
    var user = result.data;
    var userID = user.id;

    // Update User Info
    FBUsers.remove({id:userID});
    FBUsers.insert(user);

    // Remove Old Auths
    FBAuths.remove({userID:userID});

    // Store New Auth
    FBAuths.update({_id:state}, {$set:
      {
        code: code,
        token: token,
        userID: userID,
        expires: expires,
        status: "authenticated"
      }
    });
    console.log("Facebook authentication successful for user: "+user.name+" with id: "+user.id);

    // Check the Beta List
    if (userIsOnBetaList(userID))
      return true;
    else {
      console.log("However, "+user.name+" is not on the beta list! Oh noes, intruderz! lulz");
      return false;
    }
  }
});

function userIsOnBetaList(userID) {
  return (BetaList.find({userID: userID}).count() != 0);
};

function getUserAccessToken (code, redirect) {
  var url = "https://graph.facebook.com/oauth/access_token?"
  url += "client_id=" + FB_APP_ID;
  url += "&redirect_uri=" + redirect;
  url += "&client_secret=" + FB_APP_SECRET;
  url += "&code=" + code;
  return Meteor.http.get(url);
};

function getUserInfo (token) {
  var url = "https://graph.facebook.com/me?access_token="+token;
  return Meteor.http.get(url);
};