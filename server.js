const express = require('express');
const fs = require('fs');

const port = process.env.PORT || 3000;
var app = express();

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    res.sendfile('home.html');
});























//
