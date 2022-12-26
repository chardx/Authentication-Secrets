module.exports.connectToDB = connectToDB;

require("dotenv").config();
const mongoose = require("mongoose");

    //Modify if Online or Local
    const isOnline = true;
    //=-=-=-=-=-=-=-=-=-=-=-=-=


function connectToDB(){
    LOCAL_URL_STRING ="mongodb://127.0.0.1:27017";
    
    let URL_STRING = "";
    if(isOnline){
        URL_STRING = process.env.ONLINE_URL_STRING;
    }else{
        URL_STRING = LOCAL_URL_STRING;
    }

    mongoose.set("strictQuery", true);

    mongoose.connect(URL_STRING + "/userDB")
    .then((result) => console.log("Successfully Connected"))
    .catch((err) => console.log("Error connecting! " + err));
    return isOnline;
} 
