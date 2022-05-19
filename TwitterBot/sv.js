require('dotenv').config();
const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } = require('twitter-api-v2');
const express = require('express');
const app = express();
app.use(express.urlencoded({extended:true}));
const port = 2404;

const client_id = process.env.TWITTER_CLIENT_ID;
const client_secret = process.env.TWITTER_CLIENT_SECRET;

const client = new TwitterApi({ clientId: client_id, clientSecret: client_secret });

/* ----------------------- */
/* Database */
const { MongoClient } = require("mongodb")
const uri = process.env.MONGODB_URI_BLOG;
const dbClient = new MongoClient(uri);

async function dbCreateBotDocument(newDocument){      
    let result = '';
    try {
        await dbClient.connect();
        result = await dbClient.db('TwitterBot').collection('botData').deleteOne({});
        console.log('\n[database] deleteOne() =' , result,'\n');
        
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

/* ----------------------- */
let globalCode = '';
let globalCodeVerifier = '';
let globalRefreshToken = '';
let globalState = '';
let globalLoggedClient = '';

app.get('/', (req,res)=>{
    res.sendFile('./index.html',{root:__dirname})
});

app.get('/link', async (req,res)=>{

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('http://127.0.0.1:2404/callback',{ scope: ['tweet.read', 'tweet.write', 'users.read','like.write', 'offline.access'] });
    globalCodeVerifier = codeVerifier;

    res.redirect(url);

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
    
app.post('/login', async(req,res)=>{
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

    res.redirect('/')
});

app.post('/tweet', async (req,res)=>{
    console.log('---\n[/tweet] req.body.text: ', req.body.text);

    try {
        let text= req.body.text;
        let tweet =  await globalLoggedClient.v2.tweet(text);
        console.dir(tweet);
    } catch (error) {
        console.log('---\n[/tweet] Error:');
        console.dir(error.data);
    }

    res.redirect('/')
});

app.get('/stream_rules', async (req,res)=>{
    let rules = await streamClient.v2.streamRules();
    res.json(rules.data)
});

app.post('/add_stream_rule', async(req,res)=>{
    console.log(req.body)
    try {
        await streamClient.v2.updateStreamRules({
            add:[{"value": req.body.value, 'tag': req.body.tag}],
        })
    } catch (error) {
        console.log('---\n[/add_stream_rule] Error:');
        console.dir(error.data);
    }

    res.redirect('/')
});

app.post('/delete_stream_rule', async(req,res)=>{
    console.log(req.body)
    try {
        streamClient.v2.updateStreamRules({
            delete:{ids:[req.body.id]}
        })
    } catch (error) {
        console.log('---\n[/delete_stream_rule] Error:');
        console.dir(error.data);
    }

    res.redirect('/')
});


/* ----------------------- */
/* Stream practice */
const streamClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN); // (create a client)
let stream;

app.get('/me', async(req,res)=>{
    let data = '';

    if(globalLoggedClient){
        data = await globalLoggedClient.v2.me();
        data = data.data;
    }else{
        data = {username: 'None'}
    }
    
    res.json(data);
});


app.get('/test', async(req,res)=>{
    
    try {

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
                console.log('---\n')
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


/* ----------------------- */
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