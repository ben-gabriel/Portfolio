const express = require("express");
const app = express();
const port = 2404;

// -------- Database
const {database} = require('./database');
const db ='QuotesBlog';

// -------- Settings
app.set('view engine', 'ejs');
app.set('views', 'QuotesBlog/views');
app.use(express.urlencoded({extended:true}));

// -------- Session
const session = require('express-session');
const MongoDBStore  = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017',
    databaseName: 'QuotesBlog',
    collection: 'Sessions'
});

// -------- Encryption
const bcrypt = require('bcrypt');
const { redirect } = require("express/lib/response");

// -------- Routes
app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.post('/register', async (req,res)=>{

    
    try {
           //Check if username is free
        let usernameCheck = await database.findOneDocument({username:req.body.username}, db, 'Users');
        
        
        //True : save info
        if(!usernameCheck){
            console.log('can create username');
            
            let salt = await bcrypt.genSalt();
            let hashedPassword = await bcrypt.hash(req.body.password, salt);

            let newUserDocument = {
                username: req.body.username,
                password: hashedPassword,
            }
            await database.createOneDocument(newUserDocument, db, "Users");
            
            //check if creation was succesful then return
            usernameCheck = await database.findOneDocument({username:req.body.username}, db, 'Users');
            if(usernameCheck){
                // *** Creation Succesful, should login automatically
                res.redirect('/login');
            }else{
                // *** Error, Send error message
                res.redirect('/register');
            }

        }
        else{
            // *** False: send error message
            console.log('cannot create username');
            res.redirect('/register');//placeholder
        } 

    }catch (e) {
        console.log(e)
    }  
});

app.post('/login', async ()=>{
    //get user info
    //check if username exist
    //false: prompt message/prompt register
    //true: compare password
    //  if password incorrect, prompt message
    //  if password correct, authenticate con session cookie
    //  send response with user info
});

app.listen(port);



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
// --------------
// Register
// *** Add encryption method