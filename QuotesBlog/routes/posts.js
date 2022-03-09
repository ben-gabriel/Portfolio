const express = require('express');
const router = express.Router();

router.use(express.urlencoded({extended:false}));

const {database} = require('../database');

router.get('/new', (req,res)=>{
    res.render('postsNew');
});

router.get('/:id', (req,res)=>{
    
});

router.post('/new', (req,res)=>{

    if(req.session.isLoggedIn){
        
        let postUrl = req.body.postContent.slice(0,30);
        postUrl = postUrl.replace(/([^a-zA-Z ])/g, ""); //Remove special characters (regex Latin only)
        postUrl = postUrl.split(' ');
        postUrl = postUrl.join('_');
        postUrl = postUrl + '_' + Date.now();

        let newPost = {
            poster: req.session.username,
            content: req.body.postContent,
            tags: req.body.postTags,
            quoteAuthor: req.body.quoteAuthor,
            publicID: postUrl,
            comments: []
        }
        
        console.log(newPost)
        res.redirect('./new')
        // database.createOneDocument({});
        
    }
    else{
        // *** prompt to log in.
        console.log('Not logged in')
        res.redirect('./new')
    }
});

module.exports = router;