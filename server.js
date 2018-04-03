const express = require('express');
const fs = require('fs');
//const pg = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cons = require('consolidate');
const dust = require('dustjs-helpers');
const app = express();

const { Client } = require('pg');

const bcrypt = require('bcrypt');
const saltRounds = 10;

// Authentication
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pgSession = require('connect-pg-simple')(session);

// Database Connect string !
const ENV = process.env.DATABASE_URL;
var conString = ENV || "postgres://postgres:sh56348635@localhost:5432/PDiary";

//var sessionStore = new pgSession(conString);

// Assign dust engine to .dust files
app.engine('dust', cons.dust);

// set default ext .dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// set public folder
app.use(cookieParser());
app.use(express.static(path.join(__dirname + '/public')));

// Body-Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
const { check, validationResult } = require('express-validator/check');

app.use(session({
  secret: 'dfsgsdfgdsfgf',
  resave: false,
  store: new pgSession({
        conString :ENV || "postgres://postgres:sh56348635@localhost:5432/PDiary",
     }),
  saveUninitialized: false,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

//  var client = new pg.Client(conString);
//  client.connect();

app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

passport.use(new LocalStrategy (
  function(username, password, done) {
      console.log(username);
      console.log(password);

      const client = new Client(conString);
      client.connect();

      //client.query("SELECT passwords from users WHERE username = '{$username}'", (err, results) => {
      client.query("SELECT passwords, id from users where username = $1",[username], (err, results) => {
          if (err) {done(err);}

          if(results.rows.length === 0) {
              done(null, false);
          } else {

              var hash =  results.rows[0].passwords.toString();
              bcrypt.compare(password, hash, function(err, res) {
                  if(res === true) {
                      return done(null, {user_id: results.rows[0].id});
                  } else {
                      return done(null, false);
                  }
              });
          }
      });
  }
));

app.get('/timeline', authenticationMiddleware(), (req, res) => {

    const client = new Client(conString);
    client.connect();
    res.render('timeline-Index');
    // client.query('SELECT * from test', (err, result) => {
    //     if (err) {
    //         return console.error('error running query', err);
    //     } else {
    //         res.render('timeline-Index', {
    //             test: result.rows
    //         });
    //     }
    //     //client.end();
    // });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/timeline',
    failureRedirect: '/signUp'
}));

app.get('/logout',(req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/signUp');
});


app.post('/register', [

    check('password', 'passwords must be at least 6 chars long and contain one number').isLength({min: 6}),
    check('rePassword').custom((value, {req}) => {
        if(value != req.body.password) {
            throw new Error("Password Does Not Matched!");
        } else {
            return true;
        }
    })

], (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        console.log(errors.mapped());
        res.render('signUp-index', {
            title: 'Registration Error! Please Try Again!',
            errors: errors.mapped()
        });

    } else {
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        const displayname = req.body.displayname;
        const id_no = req.body.userId;

        const client = new Client(conString);
        client.connect();

        bcrypt.hash(password, saltRounds, function(err, hash) {
            client.query('INSERT INTO users(id_no, username, passwords, display_name, email) values($1, $2, $3, $4, $5)', [id_no, username, hash, displayname, email], (err, result) => {
                if (err) {
                    console.error('error running query', err);
                    res.render('signUp-index', {
                        title: 'Registration Error! Please Try Again!',
                        errors: errors.mapped()
                    });
                } else {

                    client.query('SELECT lastval() as user_id', function(error, result) {
                        if(error) throw error;

                        console.log(result.rows[0].user_id);
                        console.log(result);

                        const user_id = result.rows[0].user_id;

                        req.login(user_id, function(err) {
                            req.session.destroy();
                            res.render('signUp-index', {
                                title: 'Registration Completed! Please Login!!',
                                errors: errors.mapped()
                            });
                        });

                    });
                }
                //client.end();
            });
        });
    }
});

passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

function authenticationMiddleware() {
  return function (req, res, next) {
    console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/signUp');
  }
}


app.get('/', (req, res) => {
    //console.log(req.user);
    //console.log(req.isAuthenticated());
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









//
