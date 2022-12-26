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
const FacebookStrategy = require('passport-facebook').Strategy;

let callbackMainUrl = "";

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
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());

///Connect to Database
const isOnline = connection.connectToDB();

console.log(isOnline);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String

})

// Do heavy lifting, add salts / hashing
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Injects Encryption
// userSchema.plugin(encryption, {secret :process.env.SECRET , encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);

// 3 lines of code to rule them all
passport.use(User.createStrategy());

//Serialize Local only
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//Serialize All
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
})


// Setup OAUTH for Google
if(isOnline){
     callbackMainUrl = "https://elegant-shirt-deer.cyclic.app/auth"
}
else{
     callbackMainUrl = "http://localhost:3000/auth"
}
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: callbackMainUrl + "/google/secrets",

    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// Setup OAUTH for Facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: callbackMainUrl + "/facebook/secrets",
    // profileFields: ['id', 'displayName', 'photos', 'email']
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
})



app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));



app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication , redirect secrets

        res.redirect("/secrets")
    }
);

//facebook
app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/secrets", function (req, res) {
    User.find({secret : {$ne : null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            res.render("secrets", {
                usersWithSecret: foundUsers
            })
        }
    })
})


app.get("/submit", function (req, res) {
    console.log(req);
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    })
})

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
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