var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.get('/', function (req, res) {
    res.send('This is the official <i>parq</i> API. For more information, visit <a href=https://github.com/parq-app/parq-api>our GitHub</a>');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('./controllers'));

app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});
