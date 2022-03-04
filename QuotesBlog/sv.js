const express = require("express");
const app = express();
const port = 2404;

// -------- Database
const {database} = require('./database');


// -------- Settings
app.set('view engine', 'ejs');
app.set('views', 'QuotesBlog/views');


// -------- Routes
app.get('/', (req, res)=>{
    res.render('index');
});

app.get('login', (req, res)=>{
    res.render('login');
});

app.get('register', (req, res)=>{
    res.render('register');
});

app.listen(port);


// -------- Session
const session = require('express-session');
const MongoDBStore  = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017',
    databaseName: 'QuotesBlog',
    collection: 'Sessions'
});


app.use(session({ 
    secret: 'SecretWordExample:b94d58g2264d89e54a56s31hg7hky6...', 
    cookie: { maxAge: 600000 },
    saveUninitialized: true,
    resave: false,
    store: store
}));

// TO DO
// -------------
// -Get request-
// Check if {isLoggedIn} cookie is true/exist
//     True: Res with User Info
//     False: Set {isLoggedIn} cookie to false.
//            *Check if request requires authentication* 
//            Send response
//---------------
// -Post Request-
// Check if {isLoggedIn}
//     True: process post request with user info
//           Send response if needed
//     False: Promt to Log In/ Register
//            Send response if needed
//---------------
// **If post route = /register or /login
//     ignore {isLoggedIn} flag
//     IF: Authentication Succesful
//         set {isLoggedIn} = true
//---------------
// **If post route = /log out
// Check if {isLoggedIn}
//     True: set {isLoggedIn} = false
//     False: redirect to home

//---------------
// POST Login
// -Take User info-
// check info / authenticate against database
// IF: user does not exist
//     display error message
//     -Promt to register-
// IF: wrong password
//     display error message
//     -promt to 'recover' password
//---------------
// POST Register
// -Take User Info-
// check if username is taken
// IF: username taken
//     display error message
