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
function checkAuthentication(req, res, next){
    if(req.session.isLoggedIn){
        res.locals.userInfo = {
            isLoggedIn: true,
            username: req.session.username
        }
    }
    else{
        res.locals.userInfo = {
            isLoggedIn: false,
            username: null
        }
    }

    next()
}
app.use(checkAuthentication);

// -------- Encryption
const bcrypt = require('bcrypt');

// -------- Routes
app.get('/', (req, res)=>{
    res.redirect('/all');
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
    
    // Check if form is healthy by checking if req.body.username exist + as a string
    if(req.body.username){
        req.body.username = req.body.username.toString();

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
                        username: req.body.username.replace(/\s+/g,''), //Remove any blank spaces left over
                        password: hashedPassword,
                    }
                    await database.createOneDocument(newUserDocument, db, "Users");
                    
                    //check if creation was succesful then return
                    usernameCheck = await database.findOneDocument({username:req.body.username}, db, 'Users');
                    if(usernameCheck){
                        //Does 1st login automatically
                        req.session.isLoggedIn = true;
                        req.session.username = req.body.username;
                        res.redirect('/');
                    }else{
                        //Error, Send error message
                        res.locals.usernameError = 'Somethign went wrong creating the user, please try again.'
                        res.redirect('register');
                    }

                }
                //False : send error message
                else{
                    console.log('cannot create username');
                    res.locals.usernameError = 'Username Already Taken';
                    res.locals.usernameEntered = req.body.username;
                    res.render('register');
                } 

            }catch (e) {
                console.log(e)
            }  
        } 
        else{
            //User is already Logged In
            res.redirect('/');
        }
    }
    else{
        //Form was not healthy
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
    res. redirect('/');
});

app.get('/users/:username', async (req,res)=>{
    let userData = await database.findOneDocument({username: req.params.username},db,'Users');
    if(userData){
        res.render('userProfile',{userData});
    }
    else{
        res.status(404).render('404')
    }
});

app.get('/results', async (req,res)=>{
    let document = {};
    if(req.query.search_query){

        let searchQuery = req.query.search_query.split(',');
        
        for (let index = 0; index < searchQuery.length; index++) {
            searchQuery[index] = {tags:searchQuery[index].replace(/\s+/g,'')}
        }
        
        document = await database.findManyDocuments({$or:searchQuery},0,5,db,'Posts');
    }
    else{
        document = await database.findManyDocuments({tags:null},0,5,db,'Posts');
    }
    res.render('results',{document});
});

app.get('/all', async (req,res)=>{
    let document = await database.findManyDocuments({},0,1000,db,'Posts');
    res.render('results',{document});
});

function testMiddleware(req,res,next){
    console.log('testMiddleware');
    res.locals.myObj = {myVar: 'something'};
    next();
}

// app.use('/test', );

app.get('/test', testMiddleware, async (req,res)=>{
    // console.log(req.body);
    // console.log(req);
    // console.log(req.query);

    let document = await database.findManyDocuments({$or:[{tags: 'batman'},{tags:'movies'}]},0,5,db,'Posts');
    // console.log(document)
    
    console.log('\n ------------------------------------------------------------------ \n\n');
    // console.log(req.query);
    // console.log(req.query.text)
    // console.log(req.query.search);

    console.log(res.locals.myObj);

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

// -------- 404
app.get('/:id', (req,res)=>{
    res.render('404');
});

app.listen(port);

// TO DO 2
// ***posts*** Add <a> links in html to tags: must GET /Results as a search query
// ***searchBar*** Make it impossible to search by pressing key:Enter or click:search button when there is no parameter
//                 When there is a parameter in search input it should also enter the query even if it was not pressed by comma 
// ***Clean up partials and views [posts,search]
// ***Remove white spaces from username when registering
// ***Clean up new post form
{}
// TO DO 1
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