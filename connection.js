module.exports.connectToDB = connectToDB;

require("dotenv").config();
const mongoose = require("mongoose");

function connectToDB(){
    LOCAL_URL_STRING ="mongodb://127.0.0.1:27017";

    mongoose.set("strictQuery", true);

    mongoose.connect(LOCAL_URL_STRING + "/userDB")
    .then((result) => console.log("Successfully Connected"))
    .catch((err) => console.log("Error connecting! " + err));
}