require('dotenv').config();
// const { TwitterApi } = require('twitter-api-v2');
const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } = require('twitter-api-v2');
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

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('http://127.0.0.1:2404/callback',{ scope: ['tweet.read', 'tweet.write', 'users.read','like.write', 'offline.access'] });
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
    
app.get('/login', async(req,res)=>{
    let botData = await dbGetBotData();
    console.log('[/login] botData = \n',botData)

    globalLoggedClient =  await botLogin(botData.code, botData.codeVerifier);
    try {
        globalLoggedClient =  await client.refreshOAuth2Token(botData.refreshToken);
         console.log('[/login] \n',globalLoggedClient)

        await dbSetRefreshToken({},{refreshToken: globalLoggedClient.refreshToken});
        globalLoggedClient = globalLoggedClient.client;
    } catch (error) {
        console.error('\n\n',error.data)        
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
        console.dir(error.data)
    }

    res.end()
});

/* Stream practice */
const streamClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN); // (create a client)
let stream;

streamClient.v2.streamRules().then( data =>{
    console.log(data);
});


app.get('/me', async(req,res)=>{
    let data = await globalLoggedClient.v2.me()
    console.log(data.data.id);
    console.log(data.data);
    console.log(data);
    try {
        let test = await globalLoggedClient.v2.like('1525095929061187584','1526933852538687489')
        console.log(test);
    } catch (error) {
        console.error(error)
    }
    res.end();
});


// streamClient.v2.updateStreamRules({
//     add:[{"value": "day #100daysofcode -is:retweet -is:reply",'tag': '#100daysofcode + day keyword' }],
// }).then(data =>{
//     console.log(data);
// });

// streamClient.v2.updateStreamRules({
//     delete:{ids:['1526929887432409089']}
// }).then(data=>{
//     console.log(data);
// });

app.get('/test', async(req,res)=>{
    
    // try {
    //     let text= 'test + '+ Date.now();
    //     let test =  await globalLoggedClient() ;

    //     client.v2.sea

    //     console.dir(test);
    // } catch (error) {
    //     console.dir(error)
    // }

    // try {
    //     console.log('\n------- s1');
    //     // const stream1 = await globalLoggedClient.v2.sampleStream();
    //     const stream1 = await globalLoggedClient.v2.getStream('tweets/sample/stream');
    //     console.log(stream1);

    // } catch (error) {
    //     console.error(error.data);        
    // }

    // try {
    //     console.log('\n------- s2');
    //     const stream2 = await client.v2.sampleStream();
    //     console.log(stream2);

    // } catch (error) {
    //     console.error(error.data);        
    // }

    try {

        // stream = await streamClient.v2.sampleStream({'tweet.fields':'lang'});
        // id rule 1526919371645456384

        stream = await streamClient.v2.searchStream();

        // Awaits for a tweet
        stream.on(
            // Emitted when Node.js {response} emits a 'error' event (contains its payload).
            ETwitterStreamEvent.ConnectionError,
            err => console.log('Connection error!', err),
        );
        
        let data = await globalLoggedClient.v2.me();

        stream.on(
            // Emitted when a Twitter payload (a tweet or not, given the endpoint).
            ETwitterStreamEvent.Data,
            eventData => {console.log('Twitter has sent something:', eventData)
                console.log('---\ntest\n-\n-\n-\n-\n-\n-\n-\n')
                globalLoggedClient.v2.like(data.data.id,eventData.data.id)
            },
        );

        stream.on(
            // Emitted when a Twitter sent a signal to maintain connection active
            ETwitterStreamEvent.DataKeepAlive,
            () => console.log('Twitter has a keep-alive packet.'),
        );

        // Enable reconnect feature
        stream.autoReconnect = true;

        // Be sure to close the stream where you don't want to consume data anymore from it
        app.get('/close', (req,res)=>{
            stream.close();
            res.end();
        });

        stream.on(
            // Emitted when Node.js {response} is closed by remote or using .close().
            ETwitterStreamEvent.ConnectionClosed,
            () => console.log('Connection has been closed.'),
        );

    } catch (error) {
        console.dir(error.data)
    }

    res.end()
});
    
/* Functions */
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
        console.dir(error.data);        
    }

    return result;
};


/* ----------------------- */
console.log('--------\nTwitterBot listening in port: ', port);
app.listen(port);


/* ----------------------- */
/* Database */
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

