require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');
const app = express();
const port = 2404;

const client_id = process.env.TWITTER_CLIENT_ID;
const client_secret = process.env.TWITTER_CLIENT_SECRET;

let globalCode = '';
let globalCodeVerifier = '';
let globalRefreshToken = '';
let globalState = '';
let globalLoggedClient = '';

const client = new TwitterApi({ clientId: client_id, clientSecret: client_secret });


//Generate OAuth 2 link + code verifier
app.get('/link', async (req,res)=>{

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('http://127.0.0.1:2404/callback',{ scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] });
    globalCodeVerifier = codeVerifier;

    res.send(` <h1>URL: <a href='${url}'>OAuth2 Link</a></h1> `);

});   

app.get('/callback', async (req,res)=>{

    globalCode = req.query.code;
    globalState = req.query.state;

    globalLoggedClient  = await botLogin(globalCode, globalCodeVerifier);

    botDocument = {
        code: globalCode,
        codeVerifier: globalCodeVerifier,
        state: globalState,
        refreshToken: globalRefreshToken,
    };

    dbCreateBotDocument(botDocument);
    res.redirect('/');
});
    
async function botLogin(argCode, argCodeV){
    let code = argCode;
    let codeVerifier = argCodeV;
    let result = '';

    try {
        result = await client.loginWithOAuth2({ code, codeVerifier, redirectUri: 'http://127.0.0.1:2404/callback' });
        globalRefreshToken = result.refreshToken;
        result = result.client;
        
    } catch (error) {
        console.log('\n[loginBot] error = ');
        console.dir(error);        
    }

    return result;
};

app.get('/login', async(req,res)=>{
    let botData = await dbGetBotData();
    console.log('[/login] botData = \n',botData)

    globalLoggedClient =  await botLogin(botData.code, botData.codeVerifier);
    try {
        globalLoggedClient =  await client.refreshOAuth2Token(botData.refreshToken);
        await dbSetRefreshToken({},{refreshToken: globalLoggedClient.refreshToken});
        globalLoggedClient = globalLoggedClient.client;
    } catch (error) {
        console.error('\n\n',error)        
    }
    console.log('[/login] \n',globalLoggedClient)
    // dbSetRefreshToken()
    res.end()

});

app.get('/tweet', async (req,res)=>{

    try {
        let text= 'test + '+ Date.now();
        let test =  await globalLoggedClient.v2.tweet(text);
        console.dir(test);
    } catch (error) {
        console.dir(error)
    }

    res.end()
});
    
console.log('--------\nTwitterBot listening in port: ', port);
app.listen(port);


/* ----------------------- */
/* Datbase */
const { MongoClient } = require("mongodb")
const uri = process.env.MONGODB_URI_BLOG;
const dbClient = new MongoClient(uri);

async function dbCreateBotDocument(newDocument){      
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
    }catch (e){
        console.error(e);
        result = e;
    }finally{
        await dbClient.close()
        return result.refreshToken;
    }
}

async function dbGetBotData(queryObj={}){
    let result = '';
    try {
        await dbClient.connect();
        result = await dbClient.db('TwitterBot').collection('botData').findOne(queryObj);
    }catch (e){
        console.error(e);
        result = e;
    }finally{
        await dbClient.close()
        return result;
    }
}

