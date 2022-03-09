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

        let newPost = {
            postAuthor: req.session.userName;
        }
        
        database.createOneDocument({});
        
    }
    else{
        // prompt to log in.
    }
});

module.exports = router;