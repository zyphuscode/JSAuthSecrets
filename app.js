//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

const app = express();

console.log(process.env.API_KEY);
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true})


//userDB schema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

//userSchema.plugin(encrypt, {secret: process.env.SECRET , encryptedFields: ["password"] });
// user model

const User = new mongoose.model("User", userSchema);





app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});
// post route for login
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, function(err, foundUser){
        if (err){
          console.log(err);
        }else{
          if (foundUser){
            if(foundUser.password === password ){
              res.render("secrets");
            }
          }
        }
    });


});



app.get("/register", function(req, res){
  res.render("register");
});

// post route for register login
app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password
  )});

  newUser.save(function(err){
    if (err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
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