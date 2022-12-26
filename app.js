//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// LEVEL 2
// const encryption = require("mongoose-encryption")

// LEVEL 3
// const md5 = require("md5");

// LEVEL 4
//  const bcrypt = require("bcrypt");
//  const saltRounds = 10;
const connection = require(__dirname + "/connection.js");
const ejs = require("ejs");


//IMPORTANT
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const findOrCreate = require('mongoose-findorcreate')

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));


// SESSION & PASSPORT INITIALIZE 

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

///Connect to Database
connection.connectToDB();

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
})

// Do heavy lifting, add salts / hashing
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Injects Encryption
// userSchema.plugin(encryption, {secret :process.env.SECRET , encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);

// 3 lines of code to rule them all
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setup OAUTH
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    
    userProfileURL: "https//www.googleapis.com/oath2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





app.get("/", function (req, res) {
    res.render("home");
})


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
})
app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }

    })



})

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})

app.listen(3000, function () {
    console.log("Server started on port 3000")

})

//BCRYPT CODE

// const username = req.body.username;
// const password = req.body.password

// User.findOne({ email: username }, function (err, foundUser) {
//     if (err){
//         console.log("Error "+ err);
//     }else{
//         if(foundUser){

//             bcrypt.compare(password, foundUser.password, function(err, result) {
//                 // result == true
//                 res.render("secrets");
//             });
//         }else{  
//             console.log("Password incorrect!")
//         }
//     }
// })

// BCYPT REGISTER
// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const newUser = new User({
//         email: req.body.username,
//         password: hash
//     });
//     newUser.save(function (err) {
//         if (err) {
//             console.log(err);
//         } else {
//             res.render("secrets");
//         }
//     });

// });