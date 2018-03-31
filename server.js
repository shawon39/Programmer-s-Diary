const express = require('express');
const fs = require('fs');
const pg = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const dust = require('dustjs-helpers');
const app = express();

const port = process.env.PORT || 3000;


// Database Connect string !
var conString = "postgres://postgres:sh56348635@localhost:5432/PDiary";

// Assign dust engine to .dust files
app.engine('dust', cons.dust);

// set default ext .dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// set public folder
app.use(express.static(path.join(__dirname + '/public')));

// Body-Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// My practice code Area

var client = new pg.Client(conString);
client.connect();
//
// // For testing
// client.query('SELECT * from test', (err, res) => {
//   if (err) {
//     console.log(err.stack);
//   } else {
//     console.log(res.rows[0].name);
//   }
// });

// End My code

app.get('/timeline', (req, res) => {

    client.query('SELECT * from test', (err, result) => {
      if (err) {
        return console.error('error running query', err);
      }
      res.render('timeline-Index', {test: result.rows});
      //client.end();
    });

});



app.get('/', (req, res) => {
    res.render('home');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/tutorials', (req, res) => {
    res.render('tutorials');
});

app.get('/signUp', (req, res) => {
    res.render('signUp');
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});























//
