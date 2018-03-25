const express = require('express');
const fs = require('fs');
var pg = require('pg');
var app = express();

// Database Connection !
var conString = "postgres://postgres:sh56348635@localhost:5432/PDiary";
var client = new pg.Client(conString);
client.connect();

client.query('SELECT * from test', (err, res) => {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(res.rows[0].name);
  }
});

const port = process.env.PORT || 3000;
var app = express();

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    res.sendfile('home.html');
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});























//
