const express = require('express');
const fs = require('fs');
//const pg = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const dust = require('dustjs-helpers');
const app = express();

// Hehe
const {
    Client
} = require('pg');


// Database Connect string !
const ENV = process.env.DATABASE_URL;
var conString = ENV || "postgres://postgres:sh56348635@localhost:5432/PDiary";

// Assign dust engine to .dust files
app.engine('dust', cons.dust);

// set default ext .dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// set public folder
app.use(express.static(path.join(__dirname + '/public')));

// Body-Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


// My practice code Area

// Blaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
//  var client = new pg.Client(conString);
//  client.connect();


// Blaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
/*
app.get('/timeline', (req, res) => {

    client.query('SELECT * from test', (err, result) => {
      if (err) {
        return console.error('error running query', err);
      }
      res.render('timeline-Index', {test: result.rows});
    });

});
*/

app.get('/timeline', (req, res) => {

    const client = new Client(conString);
    client.connect();

    client.query('SELECT * from company', (err, result) => {
        if (err) {
            return console.error('error running query', err);
        } else {
            res.render('timeline-Index', {
                test: result.rows
            });
        }
        client.end();
    });

});


//////////////

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
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

// app.listen(process.env.PORT, '0.0.0.0', function(err) {
//   console.log("Started listening on %s", app.url);
// });


/*

const { Client } = require('pg')
const client = new Client()

await client.connect()

const res = await client.query('SELECT $1::text as message', ['Hello world!'])
console.log(res.rows[0].message) // Hello world!
await client.end()

*/









//
