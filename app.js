//jshint esversion:6

//module declaration

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const app = express();
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require('dotenv').config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
let accountExists = "hidden";
accountDoesNotExist = "hidden";
let wrongPassword = "hidden";



//mongo setup
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected", () => {
    console.log("Mongo is connected...");
});

//mongodb schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    phoneNumber: String,
    address: String
});


const User = new mongoose.model("User", userSchema);


//server setup

//home route - login page
app.get("/", function(req, res) {

    accountExists = "hidden"
    wrongPassword = "hidden";
    res.render("login", { existsvisible: accountExists, wrongPassword: wrongPassword });
    console.log("Login page opened");

});

//input form
app.get("/form", function(req, res) {

    res.render("login", { existsvisible: accountExists, wrongPassword: wrongPassword });

});

//download page
app.get("/download", function(req, res) {
    console.log("Download page opened");
    res.render("download");
});

app.get("/fileDownload", function(req, res) {
    const file = `idcards/id.pdf`;
    res.download(file);
    console.log("File downloaded")
})

//signup page
app.get("/signup", function(req, res) {
    res.render("signup", { doesntexistvisible: accountDoesNotExist });
    accountDoesNotExist = "hidden";
    console.log("Signup page opened");
});


//login - home page
app.get("/login", function(req, res) {
    res.render("login", { existsvisible: accountExists, wrongPassword: wrongPassword });
    console.log("Login page opened");

});


//signup post request
app.post("/signup", function(req, res) {
    const username = req.body.username;
    if (User.findOne({ email: username }, function(err, foundUser) {
            if (err) {
                //if error log error
                console.log(err);
            } else {
                if (foundUser) {
                    //if user already exists
                    accountExists = "visible";
                    res.redirect("/login");
                    console.log("User already exists");
                    //Display that user already exists on login page
                } else {
                    //create an account and hash the password
                    accountExists = "hidden";
                    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                        const newUser = new User({
                            email: req.body.username,
                            password: hash
                        });
                        //successful signup
                        console.log("Account creation successful");

                        newUser.save(function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.render("form", { name: "", address: "", phoneNumber: "", username: username });
                                console.log("Credentials Saved");
                            }
                        });
                    });
                }
            }
        }));
});


//login post request
app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password

    User.findOne({ email: username }, function(err, foundUser) {
        if (err) {
            //if error, log error
            console.log(err);
        } else {

            if (foundUser) {
                //if user exists, check password
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result == true) {
                        //if password matches
                        res.render("form", { name: foundUser.name, address: foundUser.address, phoneNumber: foundUser.phoneNumber, username: username });
                        console.log("Log in successful")
                    } else {
                        //wrong password
                        accountExists = "hidden";
                        wrongPassword = "visible";
                        res.redirect("/login");
                        console.log("Wrong password");
                    }
                });

            } else {

                //account does not exist
                accountDoesNotExist = "visible";
                res.redirect("/signup");
                console.log("Account does not exist");
            }
        }
    });
});



//form submission
//data stored in atlas
app.post("/form", function(req, res) {

    const name = req.body.inputName;
    const phoneNumber = req.body.inputPhoneNumber;
    const address = req.body.inputAddress;
    const email = req.body.email;
    User.updateOne({ email: email }, { name: name, phoneNumber: phoneNumber, address: address }, function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log("Successfully inserted form values");
        }

    });
    //pdf creation


    const PDFDocument = require('pdfkit');
    const fs = require('fs');

    // Create a document
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('idcards/id.pdf'));
    doc.image('public/css/agrigatorearth.png', {
        fit: [200, 400],
        align: 'center',
        valign: 'center'
    });
    doc.fontSize(15).text("Name : " + name);
    doc.fontSize(15).text("Phone Number : " + phoneNumber);
    doc.fontSize(15).text("Email : " + email);
    doc.fontSize(5).text("\n");
    doc.fontSize(15).text("Address :");
    doc.fontSize(15).text(address);

    doc.end();


    res.redirect("/download");
});


// server listening
app.listen(port,
    function() {
        console.log("Server started...");
    });