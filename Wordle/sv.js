const express = require('express');
const { get } = require('express/lib/response');
const app = express();
const port = 2405;

// -------- Settings
app.set('view engine', 'ejs');
app.set('views','Wordle/views');
app.use(express.urlencoded({extended:true}));

app.get('/', (req,res)=>{
    console.log('GET/')
    res.render('index');
});


app.get('/script.js',(req,res)=>{
    console.log('GET/script.js')
    res.sendFile('./scripts/script.js',{root:__dirname})
});


// --------
console.log('\nSv listening in port: ',port);
app.listen(port);

