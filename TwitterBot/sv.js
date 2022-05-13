require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const api_key = process.env.TWITTER_API_KEY;
const secret_key = process.env.TWITTER_API_SECRET_KEY;
const bearer_token = process.env.TWITTER_BEARER_TOKEN;

/*----------------- */
const https = require('https');

const options = {
    hostname: 'api.twitter.com',
    // port:2404,
    path: '/2/tweets/1524971033349935105',
    method: 'GET',
    headers: {'Authorization': 'Bearer '+ bearer_token}
};

const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();