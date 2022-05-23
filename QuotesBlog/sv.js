require('dotenv').config();
const express = require("express");
const app = express();
const port = 2405;

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
    uri: process.env.MONGO_URI_BLOG,
    databaseName: 'QuotesBlog',
    collection: 'Sessions'
});

app.use(session({ 
    secret: process.env.SESSION_SECRET_KEY_BLOG, 
    cookie: { maxAge: 60000000000 },
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
        res.locals.authRequired = ''
    }
    else{
        res.locals.userInfo = {
            isLoggedIn: false,
            username: null
        }
        res.locals.authRequired = 'authRequired'
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

    //check if form is healthy by checking if req.body.username exist + as a string
    if(req.body.username){
        req.body.username = req.body.username.toString();

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
                        // *** Promt user with error
                        console.log('incorrect password')
                        res.locals.errorMessage = 'Incorrect Password';    
                        res.render('login');
                    }
                }
                else{
                    // Wrong username / does not exist
                    // *** Promt user with error / to register 
                    console.log('incorrect Username')
                    res.locals.errorMessage = 'Incorrect Username';    
                    res.render('login')
                }

            } 
            catch (e) {
                console.log(e);
                res.redirect('/'); //placeholder, internal server error
            }
        }
        else{
            //User is already logged in
            res.redirect('/');
        }
    }
    else{
        //Form was not healthy
        res.redirect('/');
    }
});

app.post('/popup_login_html',(req,res)=>{
    res.render('loginPopup.ejs');
});

app.post('/popup_register', async(req,res)=>{  
    // Check if form is healthy by checking if req.body.username exist + as a string
    if(req.body.username && req.body.password){
        req.body.username = req.body.username.toString();
        req.body.password = req.body.password.toString();

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
                        following: [],
                        followers: [],
                        tagsOfInterest: [],
                        profilePictureUrl: '/assets/profile1.png',
                    }
                    await database.createOneDocument(newUserDocument, db, "Users");
                    
                    //check if creation was succesful then return
                    usernameCheck = await database.findOneDocument({username:req.body.username}, db, 'Users');
                    if(usernameCheck){
                        //Does 1st login automatically
                        req.session.isLoggedIn = true;
                        req.session.username = req.body.username;
                        res.json({error:null});
                    }else{
                        //Error, Send error message
                        res.json({error:'Something went wrong creating the user, please try again.'});
                    }

                }
                //False : send error message
                else{
                    console.log('cannot create username');
                    res.json({error:'Username Already Taken'});
                } 

            }catch (e) {
                console.log(e)
            }  
        } 
        else{
            //User is already Logged In
            res.json({error:'User is already Logged In'});
        }
    }
    else{
        //Form was not healthy
        res.redirect('/');
    }
});

app.post('/popup_login', async(req,res)=>{
    //check if form is healthy by checking if req.body.username exist + as a string
    if(req.body.username && req.body.password){
        req.body.username = req.body.username.toString();
        req.body.password = req.body.password.toString();

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
                        res.json({error:null});

                    }
                    else{
                        // *** Promt user with error
                        console.log('incorrect password')
                        res.json({error:'Incorrect Password'});    
                    }
                }
                else{
                    // Wrong username / does not exist
                    // *** Promt user with error / to register 
                    console.log('incorrect Username')
                    res.json({error:'Incorrect Username'});
                }

            } 
            catch (e) {
                console.log(e);
                res.redirect('/'); //placeholder, internal server error
            }
        }
        else{
            //User is already logged in
            res.json({error:'User Is Already Logged In'});
        }
    }
    else{
        //Form was not healthy
        res.redirect('/');
    }
});

app.post('/logout', (req, res)=>{
    req.session.isLoggedIn=false;
    res.json({logout:true});
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
    
    console.log('[GET/results]---------------------\n',req.query.search_query.split(','));
    document.searchQuery = req.query.search_query.split(',');
    res.render('results',{document});
});

app.get('/all', async (req,res)=>{
    console.log('[GET/all] ----------------------\n', req.query.length);
    if(req.query.sort){
        console.log('[GET/all] [IF] \n');

        if(req.query.sort === 'new'){
            let document = await database.findManyDocuments({},0,-1,db,'Posts');
            res.render('home',{document});
        }
        else if(req.query.sort === 'comments'){
            let document = await database.findManyDocuments({},0,-1,db,'Posts',{amount_comments:-1,_id:-1});
            res.render('home',{document});
        }
        else if(req.query.sort === 'hearts'){
            let document = await database.findManyDocuments({},0,-1,db,'Posts',{amount_favorites:-1,_id:-1});
            res.render('home',{document});
        }
        else{
            // url query not healthy
            let document = await database.findManyDocuments({},0,-1,db,'Posts');
            res.render('home',{document});
        }
    }
    else{
        // url query non existent
        let document = await database.findManyDocuments({},0,-1,db,'Posts');
        console.log('[GET/all] [ELSE] \n');
        res.render('home',{document});
    }

});

app.get('/following', async (req,res)=>{
    if(req.session.isLoggedIn){
        console.log("[GET/following] --------------------- \n");

        let following = await database.findManyDocuments({followers:req.session.username},0,-1,db,'Users');
        let findQuery = [];
        let document = {};

        if(following.length > 0){
            console.log('[GET/following] [IF] \n');
            
            following.forEach(user => {
                console.log('[GET/following] [forEach] user = ',user,'\n');
                findQuery.push({poster:user.username})    
            });

            if(req.query.sort){
                console.log('[GET/following] [IF^IF] query.sort = ', req.query.sort ,'\n');
        
                if(req.query.sort === 'new'){
                    document = await database.findManyDocuments({$or:findQuery},0,-1,db,'Posts');
                }
                else if(req.query.sort === 'comments'){
                    document = await database.findManyDocuments({$or:findQuery},0,-1,db,'Posts',{amount_comments:-1,_id:-1});
                }
                else if(req.query.sort === 'hearts'){
                    document = await database.findManyDocuments({$or:findQuery},0,-1,db,'Posts',{amount_favorites:-1,_id:-1});
                }
                else{
                    // url query not healthy
                    document = await database.findManyDocuments({$or:findQuery},0,-1,db,'Posts');
                }
            }
            else{
                console.log('[GET/following] [IF^ELSE] \n');
                // url query empty
                document = await database.findManyDocuments({$or:findQuery},0,-1,db,'Posts');
            }

        }
        if(!document){
            document = {};
        }

        res.render('home_following',{document});

    }
    else{
        console.log('[GET/following] [ELSE] \n');

        res.redirect('/all');
    }
    
});

app.get('/assets/:filename', async (req,res)=>{
    res.sendFile('./assets/'+req.params.filename,{root:__dirname})
});

// -------- Users (*** Make router)
app.post('/users/favorite/:postUrl', async (req,res)=>{
   if(req.session.isLoggedIn){
        let checkPost = await database.findOneDocument({publicID: req.params.postUrl},db,'Posts'); // !undefined = post exist
        if(checkPost){
            let checkFavStatus = checkPost.favoritedBy.includes(req.session.username);
            if(checkFavStatus){
                let result = await database.pullFromDocument({publicID: req.params.postUrl},{favoritedBy: req.session.username},db,'Posts',{amount_favorites:-1});
                if(result.modifiedCount === 1){
                    res.json({favoriteStatus:false, action: 'removed'});
                }
                else{
                    res.json({favoriteStatus:true, error: 'Error removing post from favorites'});
                }
            }
            else{
                let result = await database.pushToDocument({publicID: req.params.postUrl},{favoritedBy: req.session.username},db,'Posts',{amount_favorites:1});
                if(result.modifiedCount === 1){
                    res.json({favoriteStatus:true, action: 'added'});
                }
                else{
                    res.json({favoriteStatus:false, error: 'Error adding post to favorites'});
                }
            }
        }
        else{
            res.json({error:`Post not found: ${req.params.postUrl}`});
        }
    }
    else{
        res.json({error:'Not Logged In'});
    } 
});

app.post('/users/follow/:username', async(req,res)=>{    
    console.log('\n/users/follow/:username = --------------');
    if(req.session.isLoggedIn){
        let userCheck = await database.findOneDocument({username:req.session.username},db,'Users');
        let userToFollowCheck = await database.findOneDocument({username:req.params.username},db,'Users');
        if(userCheck && userToFollowCheck){
            // db: users found
            // check if session.username is following params.username
            followCheck = userCheck.following.includes(req.params.username);
            if(followCheck){
                let following_result = await database.pullFromDocument({username:req.session.username},{following: req.params.username},db,'Users');
                let followers_result = await database.pullFromDocument({username:req.params.username},{followers: req.session.username},db,'Users');
                if(followers_result.modifiedCount === 1 && following_result.modifiedCount === 1){
                    res.json({followStatus:false, action: 'removed'});
                }
                else{
                    res.json({followStatus:true, 
                        error: 'Error removing follow status',
                        followers_result: followers_result.modifiedCount,
                        following_result: following_result.modifiedCount,
                    });
                }
                
            }
            else{
                let following_result = await database.pushToDocument({username:req.session.username},{following: req.params.username},db,'Users');
                let followers_result = await database.pushToDocument({username:req.params.username},{followers: req.session.username},db,'Users');
                if(followers_result.modifiedCount === 1 && following_result.modifiedCount === 1){
                    res.json({followStatus:true, action: 'added'});
                }
                else{
                    res.json({followStatus:false, 
                        error: 'Error adding follow status',
                        followers_result: followers_result.modifiedCount,
                        following_result: following_result.modifiedCount,
                    });
                }
            }
        }
        else{
            // db: users not found
            res.json({error:'Database Error - User not found'});
        }
    }
    else{
        res.json({error:'Not Logged In'});
    }
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

app.get('/users/posts/:username', async (req,res)=>{
    let document = await database.findManyDocuments({poster:req.params.username},0,-1,db,'Posts');
    console.log('/users/posts/:username = --------------\n', document);
    res.render('partials/postsPreview.ejs',{document});
});

app.get('/users/favorites/:username', async (req,res)=>{
    let document = await database.findManyDocuments({favoritedBy:req.params.username},0,-1,db,'Posts');
    console.log('/users/favorites/:username = --------------\n', document);
    res.render('partials/postsPreview.ejs',{document});
});

app.get('/users/following/:username', async (req,res)=>{
    let usersDocument = await database.findManyDocuments({followers:req.params.username},0,5,db,'Users');
    console.log('/users/following/:username = --------------\n',usersDocument);
    res.render('partials/user_follow_card.ejs',{usersDocument});
});

app.get('/users/followers/:username', async (req,res)=>{
    let usersDocument = await database.findManyDocuments({following:req.params.username},0,5,db,'Users');
    console.log('/users/followers/:username = --------------\n',usersDocument);
    res.render('partials/user_follow_card.ejs',{usersDocument});

});

app.get('/users/popup/:username', async(req,res)=>{
    let userDataPrivate = await database.findOneDocument({username:req.params.username},db,"Users");
    let userData = {
        profileImg: userDataPrivate.profilePictureUrl,
        followers: userDataPrivate.followers.length,
        following: userDataPrivate.following.length
    }
    
    if(req.session.isLoggedIn){
        if(userDataPrivate.followers.includes(req.session.username)){
            userData.followStatus = true;
        }
        else{
            userData.followStatus = false;
        }
    }
    else{
        userData.followStatus = false;
    }

    res.json(userData);
});

app.post('/users/profile_picture', async (req,res)=>{
    if(req.session.isLoggedIn){
        await database.updateOneDocument({username:req.session.username},{profilePictureUrl:req.body.picture_url},db,'Users');
        console.log('[POST/users/profile_picture] ------------ \n');
        res.redirect('/users/'+req.session.username);
    }
    else{
        res.end();
    }
});


// -------- Scripts
app.get('/scripts/:fileName',(req,res)=>{
    console.log(`\n\n/scripts/:filename = ${req.params.fileName} --------------------`);
    res.sendFile('./scripts/'+req.params.fileName,{root:__dirname});
});


// -------- Test Route
function testMiddleware(req,res,next){
    console.log('testMiddleware');
    res.locals.myObj = {myVar: 'something'};
    next();
}

const fs = require('fs'); /* file system */
const fileUpload = require('express-fileupload');
// app.use('/test',fileUpload({
//     // useTempFiles : true,
//     // tempFileDir : 'C:/Users/sergi/Desktop/',
//     createParentPath: true,
// }));

app.get('/test', async (req,res)=>{
    console.log('[GET/test]--------------------\n');
    res.render('test');
});

// app.post('/test', (req,res)=>{
//     console.log('[POST/test]--------------------\n',req.files);
//     // req.files.input_name.mv(`C:/Users/sergi/Desktop/img/test${Date.now()}.png`)
    
//     let string = req.files.input_name.data.toString().replace(/([^a-zA-Z ])/g,'a')
//     let mdata = Buffer.from(string,'utf8')
//     req.files.input_name.encoding = 'utf8'
//     req.files.input_name.encoding.data = mdata
//     console.log(req.files)
//     req.files.input_name.mv(`C:/Users/sergi/Desktop/img/test${Date.now()}.jpg`)
//     res.render('test');
// });


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
const { stringify } = require("querystring");
const { render } = require("express/lib/response");
const req = require("express/lib/request");
app.use('/posts', postsRouter);

// -------- Style
app.get('/style.css',(req,res)=>{
    res.sendFile('./style_ProtoV2.css',{root:__dirname})
});

// -------- 404
app.get('*', (req,res)=>{
    res.status(404).render('404');
});

app.listen(port);

{// TO DO 2
// ***posts*** Add <a> links in html to tags: must GET /Results as a search query
// ***searchBar*** Make it impossible to search by pressing key:Enter or click:search button when there is no parameter
//                 When there is a parameter in search input it should also enter the query even if it was not pressed by comma 
// ***Clean up partials and views [posts,search]
// ***Remove white spaces from username when registering
// ***Clean up new post form
// ***Check what happens if you try to access a body.thing that does not exist in the form 
}
{// TO DO 1
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
}