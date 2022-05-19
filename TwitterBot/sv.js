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
    console.log('[/login] botData = \n',botData);

    globalLoggedClient =  await botLogin(botData.code, botData.codeVerifier);
    
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
    console.log('---\n[/add_stream_rule] Body:');
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
    console.log('---\n[/delete_stream_rule] Body:');
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

app.get('/me', async(req,res)=>{
    let data = '';

    if(globalLoggedClient !== ''){
        data = await globalLoggedClient.v2.me();
        data = data.data;
    }else{
        data = {username: -1}
    }
    
    res.json(data);
});


/* ----------------------- */
/* Stream */
const streamClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN); // (create a client)
let stream;

app.post('/start_stream', async(req,res)=>{
    if(globalLoggedClient !== ''){
        let userData = await globalLoggedClient.v2.me();

        try {
            //tweet.fields=entities
            stream = await streamClient.v2.searchStream({'tweet.fields':'entities'});
            
            stream.on(ETwitterStreamEvent.Data, eventData => {
                // Emitted when a Twitter payload (a tweet or not, given the endpoint).
                console.log('---\n');
                console.log('Twitter has sent: ', eventData);

                eventData.matching_rules.forEach(rule => {
                    if(rule.tag === 'like'){
                        globalLoggedClient.v2.like(userData.data.id, eventData.data.id);
                    }
                    if(eventData.data.entities.hashtags.length < 4){
                        if(rule.tag === 'retweet'){
                            globalLoggedClient.v2.retweet(userData.data.id, eventData.data.id);
                        }
                        if(rule.tag === 'test'){
                            console.log('---\nTEST TAG\n');
                        }
                    }
                });

            });

            stream.on(ETwitterStreamEvent.ConnectionError, err =>{
                    // Emitted when Node.js {response} emits a 'error' event (contains its payload).
                    console.log('[/start_stream] Connection error!', err);
                }
            );

            stream.on(ETwitterStreamEvent.DataKeepAlive,() => {
                // Emitted when a Twitter sent a signal to maintain connection active
                console.log('[/start_stream] Twitter has a keep-alive packet.')
            });

            stream.autoReconnect = true;
            setInterval(botLogin, 7080000); //refresh after 128 minutes
            console.log('[/start_stream] Connection successful, Stream started');

        } catch (error) {
            console.log('[/start_stream] Error = ');
            console.dir(error.data);
        }
    }
    else{
        console.log('[/start_stream] else: Not logged in');
    }

    res.redirect('/');
});

app.post('/close_stream', (req,res)=>{
    if(stream){
        stream.on(ETwitterStreamEvent.ConnectionClosed, () =>{
            // Emitted when Node.js {response} is closed by remote or using .close().
            console.log('[/close_stream] Connection has been closed');
        });
        stream.close();
    }
    else{
        console.log('[/close_stream] No Connection to close');
    }
    res.redirect('/');
});


/* ----------------------- */
/* Functions */
async function botLogin(argCode = '', argCodeV = ''){
    let code = argCode;
    let codeVerifier = argCodeV;
    let result = '';

    try {
        result = await client.loginWithOAuth2({ code, codeVerifier, redirectUri: 'http://127.0.0.1:2404/callback' });
        globalRefreshToken = result.refreshToken;
        result = result.client;
        console.log('----\n[botLogin] loginWithOAuth2 result = ', result)
        
    } catch (error) {
        console.log('----\n[botLogin] loginWithOAuth2 error = ');
        console.dir(error.data);

        // If it can't login, then try refresh token.
        try {
            argRefreshT = await dbGetRefreshToken();
            result =  await client.refreshOAuth2Token(argRefreshT);
            console.log('----\n[botLogin] refreshOAuth2Token result = ',result)
    
            await dbSetRefreshToken({},{refreshToken: result.refreshToken});
            result = result.client;

        } catch (error) {
            console.log('----\n[botLogin] refreshOAuth2Token error = ');
            console.error(error)        
        }        

    }

    return result;
};


/* ----------------------- */
/* Test */
app.get('/test', (req,res)=>{
    res.end();
});

/* ----------------------- */
console.log('--------\nTwitterBot listening in port: ', port);
app.listen(port);

