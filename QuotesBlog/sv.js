const express = require("express");
const { render } = require("express/lib/response");
const app = express();
const port = 2404;

// -------- Database
const {database} = require('./database');
// -------- Settings
app.set('view engine', 'ejs');
app.set('views', 'QuotesBlog/views');


app.get('/', (req, res)=>{
    res.render('index');
});


app.listen(port);

// TO DO
// -------------
// -Get request-
// Check if {isLoggedIn}
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
//     set {isLoggedIn} = true
//---------------
// **If post route = /log out
// Check if {isLoggedIn}
//     True: set {isLoggedIn} = false
//     False: redirect to home