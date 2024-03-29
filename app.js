//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//session for cookies
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false

}));

//initializing passport
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set("useCreateIndex", true);

//userDB schema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secrets: String
});

//userSchema for passport plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//userSchema.plugin(encrypt, {secret: process.env.SECRET , encryptedFields: ["password"] });
// user model

const User = new mongoose.model("User", userSchema);
//passport strategy
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile)
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//route for the google button
app.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile"]} )
);

app.get("/auth/google/secrets", 
passport.authenticate("google", {failureRedirect: "/login"}),
function(req, res){
  //successful authentication, redirect home,
  res.redirect("/");

});



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});
// post route for login
app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  //passport login method
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  })
});



app.get("/register", function(req, res){
  res.render("register");
});

//secret route, that user can access after logged in through passport authentication
app.get("/secrets", function (req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUser){
    if (err){
      console.log(err);
    }else {
      if (foundUser) {
        res.render("secrets", {usersWithSecrets: foundUser});
      }
    }
  } );
});

//get route for submit secrets
app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else{
    res.redirect("/login");
  }
});

//post route for submit secrets
app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function (req, res){
  req.logout();
  res.redirect("/");
});

// post route for register login
app.post("/register", function(req, res){
  //setting passport method on register route 
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })
});

//app.get("/secrets", function(req, res){
 // res.render("secrets");
//});

app.get("/submit", function(req, res){
  res.render("submit")
});






















app.listen(3000, function(req, res){
  console.log("Server is running at port 3000")

});