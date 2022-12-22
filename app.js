//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encryption = require("mongoose-encryption")
const connection = require(__dirname + "/connection.js");
const ejs = require("ejs");




const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

///Connect to Database
connection.connectToDB();

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
})

const secret = "Thisisourlittlesecret.";

// Injects Encryption
userSchema.plugin(encryption, {secret :secret , encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {


    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });

})

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password

    User.findOne({ email: username }, function (err, foundUser) {
        if (err){
            console.log("Error "+ err);
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }else{  
                console.log("Password incorrect!")
            }
        }
    })
})

app.listen(3000, function () {
    console.log("Server started on port 3000")

})