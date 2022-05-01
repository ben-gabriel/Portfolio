const express = require('express');
const { get } = require('express/lib/response');
const app = express();
const port = 2404;

// -------- Settings
app.set('view engine', 'ejs');
app.set('views','Wordle/views');
app.use(express.urlencoded({extended:true}));

app.get('/', (req,res)=>{
    res.render('index');
});


app.get('/test.js',(req,res)=>{
    res.sendFile('./test.js',{root:__dirname})
});


// --------
console.log('\nSv listening in port: ',port);
app.listen(port);

