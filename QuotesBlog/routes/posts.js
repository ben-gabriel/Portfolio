const express = require('express');
const { redirect } = require('express/lib/response');
const router = express.Router();
let db = 'QuotesBlog';
let collection = 'Posts';

router.use(express.urlencoded({extended:false}));

const {database} = require('../database');

router.get('/new', (req,res)=>{
    if(req.session.isLoggedIn){
        res.render('postsNew');
    }
    else{
        res.redirect('/login');
    }
});

router.post('/new', async (req,res)=>{

    if(req.session.isLoggedIn){
        
        let postUrl = req.body.postContent.slice(0,30);
        postUrl = postUrl.replace(/([^a-zA-Z ])/g, ""); // Removes special characters (regex Latin only)
        postUrl = postUrl.split(' ');
        postUrl = postUrl.join('_');
        postUrl = postUrl + '_' + Date.now();

        let postTags = req.body.postTags;
        postTags = postTags.split(',');

        let newPost = {
            poster: req.session.username,
            content: req.body.postContent,
            tags: postTags,
            quoteAuthor: req.body.quoteAuthor,
            publicID: postUrl,
            comments: []
        }
        
        console.log(newPost)
        await database.createOneDocument(newPost,db,collection);
        let postCheck = await database.findOneDocument({publicID:postUrl},db,collection);

        if(postCheck){
            console.log('Post creation successful');
            res.redirect('./'+postUrl); 
        }
        else{
            console.log('error creating post');
            res.redirect('./new');
        }
    }
    else{
        // *** prompt to log in.
        console.log('Not logged in')
        res.redirect('./new')
    }
});

router.post('/newComment', async (req,res)=>{
    console.log(req.body.commentContent);
    
    let commentInsert = {
        commentContent : req.body.commentContent,
        commentAuthor : req.session.username,
        commentID :  req.session.username + Date.now(),
        replyingToID : req.body.replyingToID,
    }

    if(req.session.isLoggedIn){
        // database.updateOneDocument({}, )   
    
        await database.pushToDocument({publicID: req.body.postUrl}, {comments:commentInsert}, db,collection);
        res.redirect(req.body.postUrl);

    }
    else{
        // *** promt to log in
        console.log('not logged in');
        res.redirect(req.body.postUrl);
    }

    
});

router.get('/comments/:postUrl', async (req,res)=>{
    let document = await database.findOneDocument({publicID:req.params.postUrl}, db,collection);
    res.json(document.comments);
});

router.get('/:id', async (req,res)=>{
    
    let postUrl = (req.params.id)
    try {
        let postLookout = await database.findOneDocument({publicID: postUrl},db,collection);
        
        if(postLookout){
            let postInfo=postLookout;
            res.render('singlePost',{postInfo});
        }
        else{
            res.send('not found') //placeholder
        }

    } 
    catch (e) {
        console.log(e);
        res.redirect('/');
    }

});

module.exports = router;