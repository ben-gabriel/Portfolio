const { localsName } = require('ejs');
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
        // Form Check health
        let fc_1 = req.body.postContent.length;
        let fc_2 = req.body.quoteAuthor.length;
        let fc_3 = req.body.postTags.length;

        if((fc_1>2&&fc_1<600) && (fc_2<30) && (fc_3>0)){
            let postUrl = req.body.postContent.slice(0,30);
            postUrl = postUrl.replace(/([^a-zA-Z ])/g, ""); // Removes special characters (regex Latin only)
            postUrl = postUrl.split(' ');
            postUrl = postUrl.join('_');
            postUrl = postUrl + '_' + Date.now();

            let postTags = req.body.postTags;
            postTags = postTags.split(',');
            for (let index = 0; index < postTags.length; index++) {
                postTags[index] = postTags[index].replace(/\s+/g,'');
            }

            let contentBreakSpamRemoved = '';
            let contentSplit = req.body.postContent.replace(/\r\n/g,'{\100f}{CTB--07}'); 
            contentSplit = contentSplit.split('{\100f}{CTB--07}');
            contentSplit.forEach(element => {
                if(element === ''){
                }
                else if(contentBreakSpamRemoved === ''){
                    contentBreakSpamRemoved = element; 
                }
                else{
                    contentBreakSpamRemoved = contentBreakSpamRemoved +'\r\n' + element; 
                }
            });

            if(req.body.quoteAuthor === ''){
                req.body.quoteAuthor = 'Suggest';
            }

            let newPost = {
                poster: req.session.username,
                date: Date.now(),
                content: contentBreakSpamRemoved,
                tags: postTags,
                quoteAuthor: req.body.quoteAuthor,
                publicID: postUrl,
                comments: [],
                favoritedBy:[],
                amount_comments:0,
                amount_favorites:0,
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
            //Form was not healthy
            res.redirect('./new')
            console.log('\n[POST/posts/new] Form was not healthy: ', req.body);
        }
    }
    else{
        // *** prompt to log in.
        console.log('Not logged in')
        res.redirect('./new')
    }
});

router.post('/delete/:postUrl', async(req,res)=>{
    console.log('\n\n ------- POST/delete');

    let checkPost = await database.findOneDocument({publicID:req.params.postUrl},db,'Posts');
    if(checkPost){
        if(checkPost.poster === req.session.username){
            console.log('User auth true: Delete post');
            let checkDelete = await database.deleteOneDocument({publicID:req.params.postUrl},db,'Posts');
            if(checkDelete.deletedCount !== 0){
                res.json({action:'deleted'});
            }
            else{
                res.json({error:'Something went wrong, try again'});
            }
        }
        else{
            console.log('Username Does Not Pass Authentication');
            res.json({error:'User Does Not Pass Authentication'});
        }
    }
    else{
        console.log('Post Not Found: checkPost = ',checkPost);
        res.json({error:'Post Not Found'});
    }
});

router.post('/newComment', async (req,res)=>{
    console.log(req.body.commentContent);
    
    let commentInsert = {
        commentContent : req.body.commentContent,
        commentAuthor : req.session.username,
        commentID :  req.session.username + Date.now(),
        date : Date.now(),
        replyingToID : req.body.replyingToID,
    }

    if(req.session.isLoggedIn){
        // database.updateOneDocument({}, )   
    
        await database.pushToDocument({publicID: req.body.postUrl}, {comments:commentInsert}, db,collection,{amount_comments:1});
        res.redirect(req.body.postUrl);

    }
    else{
        // *** prompt to log in
        console.log('not logged in');
        res.redirect('/login');
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