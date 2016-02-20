var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(require('./controllers'));

app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});

