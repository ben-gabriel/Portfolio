const express = require('express');
const app = express();
const port = 2404;

app.get('/', (req,res)=>{
    res.sendFile('./index.html',{root:__dirname})
});
app.get('/assets/:filename',(req,res)=>{
    res.sendFile('./assets/'+req.params.filename,{root:__dirname})
});

console.log('LandingPAge sv listening in port: ',port)
app.listen(port)