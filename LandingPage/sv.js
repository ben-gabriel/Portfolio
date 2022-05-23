const express = require('express');
const app = express();
const port = 2405;

app.get('/', (req,res)=>{
    console.log('\n\n');
    res.sendFile('./index.html',{root:__dirname})
});
app.get('/assets/:filename',(req,res)=>{
    console.log('GET/assets/:',req.params.filename);
    res.sendFile('./assets/'+req.params.filename,{root:__dirname})
});

console.log('LandingPAge sv listening in port: ',port)
app.listen(port)