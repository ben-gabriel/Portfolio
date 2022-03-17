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

app.use(session({ 
    secret: 'SecretWord', 
    cookie: { maxAge: 600000 },
    saveUninitialized: true,
    resave: false,
    store: store
}));

// -------- Authentication Middleware
// function checkAuthentication(req, res, next){

//     console.log('log in checkAuthentication');
//     console.log(req.session);
//     console.log(req.session.isLoggedIn);

//     if(req.session.isLoggedIn){

//     }
//     next()
    
// }
// app.use(checkAuthentication);

// -------- Encryption
const bcrypt = require('bcrypt');

// -------- Routes
app.get('/', (req, res)=>{
    let userInfo = {}
    if(req.session.isLoggedIn){
        userInfo = {username:req.session.username}
    }
    res.render('index',{userInfo});
});

app.get('/login', (req, res)=>{
    if(!req.session.isLoggedIn){
        res.render('login');
    }else{
        res.redirect('/');
    }
});

app.get('/register', (req, res)=>{
    if(!req.session.isLoggedIn){
        res.render('register');
    }else{
        res.redirect('/');
    }
});

app.post('/register', async (req,res)=>{

    // *** To Do, check if form is healthy
    //     by checking if req.body.username exist+ as a string
    if(!req.session.isLoggedIn){
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
    } 
    else{
        res.redirect('/');
    }
});

app.post('/login', async (req, res)=>{
    //get user info
    //check if username exist
    //false: prompt message/prompt register
    //true: compare password
    //  if password incorrect, prompt message
    //  if password correct, authenticate with session cookie
    //  send response with user info

    // *** To Do, check if form is healthy
    //     by checking if req.body.username exist+ as a string
    //     -check what happens if you try to access a body.thing that does not exist in the form 
    
    if(!req.session.isLoggedIn){
        try {
            let userCheck = await database.findOneDocument({username: req.body.username}, db, 'Users');
            if(userCheck){
                // Username is correct, compare password
                let passwordComparison = await bcrypt.compare(req.body.password, userCheck.password);

                if(passwordComparison){
                    console.log('password is correct');
                    req.session.isLoggedIn = true;
                    req.session.username = userCheck.username;
                    res.redirect('/');

                }
                else{
                    console.log('incorrect password')
                    // *** Promt user with error
                    res.redirect('/login');
                }
            }
            else{
                // Wrong username / does not exist
                // *** Promt user with error / to register 
                res.redirect('/login')
            }

        } 
        catch (e) {
            console.log(e);
            res.redirect('/'); //placeholder
        }
    }
    else{
        res.redirect('/');
    }
});

app.post('/logout', (req, res)=>{
    req.session.isLoggedIn=false;
    res.redirect('/');
});

app.get('/users/:username', async (req,res)=>{
    let userData = await database.findOneDocument({username: req.params.username},db,'Users');
    res.render('userProfile',{userData});
});

app.get('/results', (req,res)=>{
    // call to database based on querys and send response 
    console.log(req.query);
    console.log(req.query.search_query);

    let searchQuery = req.query.search_query.split(',');
    console.log(searchQuery);
    searchQuery.forEach(tag => {
        tag = tag.replace(/\s+/g,'');
    });


    res.render('results');
});

app.get('/test', async (req,res)=>{
    // console.log(req.body);
    // console.log(req);
    // console.log(req.query);

    let document = await database.findManyDocuments({$or:[{tags: 'batman'},{tags:'movies'}]},0,5,db,'Posts');
    // console.log(document)
    
    console.log('\n ------------------------------------------------------------------ \n\n');
    console.log(req.query);
    console.log(req.query.text)
    console.log(req.query.search);

    res.render('test',{document});
});

// -------- Routes-> express.Router()
//
// /users
// /u/someone -> profile of some user 
// /u/me -> my profile
//
// /posts
// /#search_query/pageNumber
// /all/pageNumber

const postsRouter = require('./routes/posts.js');
app.use('/posts', postsRouter);

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