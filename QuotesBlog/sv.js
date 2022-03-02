const express = require("express");
const { render } = require("express/lib/response");
const app = express();
const port = 2404;


// -------- Settings
app.set('view engine', 'ejs');
app.set('views', 'QuotesBlog/views');


app.get('/', (req, res)=>{
    res.render('index');
});

app.listen(port);