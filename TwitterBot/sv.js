require('dotenv').config();

const api_key = process.env.TWITTER_API_KEY;
const secret_key = process.env.TWITTER_API_SECRET_KEY;
const bearer_token = process.env.TWITTER_BEARER_TOKEN;
const acces_token = process.env.TWITTER_ACCESS_TOKEN;
const acces_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
const client_id = process.env.TWITTER_CLIENT_ID;
const client_secret = process.env.TWITTER_CLIENT_SECRET;

/*----------------- */
/* Native http GET req to api */

// const https = require('https');

// const options = {
//     hostname: 'api.twitter.com',
//     // port:2404,
//     path: '/2/tweets?ids=1524971033349935105',
//     method: 'GET',
//     headers: {'Authorization': 'Bearer '+ bearer_token}
// };

// let test;

// const req = https.request(options, res => {
//     console.log(`statusCode: ${res.statusCode}`);

//     res.on('data', d => {
//         test = d;
//         console.dir(test.toString())
//         console.log('\n')
//     });
// });


// req.on('error', error => {
//     console.error(error);
// });

// req.end();

/*----------------- */
// TwitterApi npm Module


const { TwitterApi } = require('twitter-api-v2');
let mycode;

(async ()=>{
    console.log('-------\n');

    const client = new TwitterApi({ clientId: client_id, clientSecret: client_secret });
    
    // Don't forget to specify 'offline.access' in scope list if you want to refresh your token later
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('http://127.0.0.1:2404/callback', { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] });
    console.log('\nurl: ',url)
    console.log('\ncode: ',codeVerifier)
    mycode = codeVerifier;
    console.log('\nstate: ',state)
    myurl = url;
    // Redirect your user to {url}, store {state} and {codeVerifier} into a DB/Redis/memory after user redirection


})();
    
const express = require('express');
const app = express();
const port = 2404;

app.get('/callback', (req, res) => {
    const { state, code } = req.query;
    // Obtain access token
    codeVerifier = mycode;

    const client = new TwitterApi({ clientId: client_id, clientSecret: client_secret });
  
    client.loginWithOAuth2({ code, codeVerifier, redirectUri: 'http://127.0.0.1:2404/callback' })
    .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
        // {loggedClient} is an authenticated client in behalf of some user
        // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
        // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
        // Example request
        loggedClient.v2.tweet('Twitter-api-v2 test, sending this from sv.js ... hello world?... are you listening? #coding #bot');
        
    })
    .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
    
}); 
    
    
app.listen(port)

// state1 jguJeTVAVLjsYAS9P6kUBGcw5zf0l_Ic
// code1 KfLpAEW2hy2cJ11kK3RVVM6vTAduBe3U7VU9xaYcnicbDfYCetnYRGdeYu0WmEyDvw0MX4L0F.VC0gIEIDhYCa9~J3F61vsY7X3J7Zb4hNMWubofyJUIxnNusAD3ZMA2
// code2 aWdOMDRGcHB0YmJGNmYtT2tkWHlIcTdwRkw0Qkk4TzJmMUNIRVNUZjJPMzl0OjE2NTI1NTI4MDc0MTU6MTowOmFjOjE
// 
// 
// 


