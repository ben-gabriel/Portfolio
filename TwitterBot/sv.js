require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');
const app = express();
const port = 2404;

const client_id = process.env.TWITTER_CLIENT_ID;
const client_secret = process.env.TWITTER_CLIENT_SECRET;
let globalRefreshToken = process.env.TWITTER_BOT_REFRESH_TOKEN;
let globalCodeVerifier = process.env.TWITTER_BOT_CODE_VERIFIER;
let globalCode = process.env.TWITTER_BOT_CODE;
// let globalCode = '';
// let globalCodeVerifier = '';
let globalState = '';
let loggedClient = '';

const client = new TwitterApi({ clientId: client_id, clientSecret: client_secret });

//Generate OAuth 2 link + code verifier
app.get('/link', async (req,res)=>{

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('http://127.0.0.1:2404/callback',{ scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] });
    globalCodeVerifier = codeVerifier;
    globalState = state;

    res.send(`
        <h1>URL: <a href='${url}'>link</a></h1>
        <p>CodeVerifier: ${codeVerifier}<p>
        <p>State: ${state}<p>
    `);

});   

app.get('/callback', async (req,res)=>{

    globalCode = req.query.code;
    res.send(`
        <p>Code: ${req.query.code}<p>
    `);

});
    
app.get('/login', async(req, res)=>{
    let code = globalCode;
    let codeVerifier = globalCodeVerifier;
    
    try {
        loggedClient = await client.loginWithOAuth2({ code, codeVerifier, redirectUri: 'http://127.0.0.1:2404/callback' });
        loggedClient = loggedClient.client;
        console.dir(await loggedClient);
        
        // res.send(`
        //     TWITTER_BOT_CODE_VERIFIER = '${codeVerifier}' <br>
        //     TWITTER_BOT_CODE = '${code}' <br>
        //     TWITTER_BOT_STATE = '${globalState}' <br>
        //     TWITTER_BOT_REFRESH_TOKEN = '${loggedClient.refreshToken}' <br>
        // `);
        
    } catch (error) {
        console.dir(error);        
    }

    // try {
    //     let test = await client.refreshOAuth2Token('eWRHVXptMDZmd0l1bmdzb1lBVVNBRjFycllqTDBZa1lHZ2lOX2QtYzJNd3duOjE2NTI3MzQ2NTE1NjQ6MTowOnJ0OjE');
    //     console.dir(await test);
    // } catch (error) {
    //     console.dir(error)        
    // }
    
    res.send('<a href="/tweet">tweet</a>');

});

app.get('/tweet', async (req,res)=>{

    try {
        let text= 'test + '+ Date.now();
        let test =  await loggedClient.v2.tweet(text);
        console.dir(test);
    } catch (error) {
        console.dir(error)
    }

    res.end()
});


    
console.log('--------\nTwitterBot listening in port: ', port);
app.listen(port);

/* Datbase */
const { MongoClient } = require("mongodb")

const uri = process.env.MONGODB_URI_BLOG;
const dbClient = new MongoClient(uri);

async function dbCreateBotData(newDocument){      
    let result = '';
    try {
        await dbClient.connect();
        result = await dbClient.db('TwitterBot').collection('botData').insertOne(newDocument);
        console.log('\n[database] createOne() =' , result,'\n');

    }catch (e){
        console.error(e);
        result = e;
    }finally{
        await dbClient.close();
        return result.insertedId;
    }   
}

async function dbSetRefreshToken(queryObj={}, insertObj){
    let result= '';
    try {
        await dbClient.connect();
        result = await dbClient.db('TwitterBot').collection('botData').updateOne(queryObj, {$set: insertObj});
        console.log('\n[database] updateOneDocument() =', result,'\n');

    }catch (e){
        console.error(e);
        result = e;
    }finally{
        await dbClient.close()
        return result;
    }
}
async function dbGetRefreshToken(queryObj={}){
    let result = '';
    try {
        await dbClient.connect();
        result = await dbClient.db('TwitterBot').collection('botData').findOne(queryObj);
        console.log('\n[database] findOne() =' , result,'\n');
        
    }catch (e){
        console.error(e);
        result = e;
    }finally{
        await dbClient.close()
        return result;
    }
}


