const express = require('express');
const fs = require('fs');
//const pg = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cons = require('consolidate');
const dust = require('dustjs-helpers');
const app = express();

// const main = require('./public/js/main');
//
// main.hello();

const {
    Client
} = require('pg');

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

//var sessionStore = new pgSession(conString)

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
const {
    check,
    validationResult
} = require('express-validator/check');

app.use(session({
    secret: 'dfsgsdfgdsfgf',
    resave: false,
    store: new pgSession({
        conString: ENV || "postgres://postgres:sh56348635@localhost:5432/PDiary",
    }),
    saveUninitialized: false,
    //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

//  var client = new pg.Client(conString);
//  client.connect();

app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

var id_number;

passport.use(new LocalStrategy(
    function(username, password, done) {
        //console.log(username);
        //console.log(password);

        const client = new Client(conString);
        client.connect();

        //client.query("SELECT passwords from users WHERE username = '{$username}'", (err, results) => {
        client.query("SELECT id_no, passwords, id from users where username = $1", [username], (err, results) => {
            if (err) {
                done(err);
            }

            if (results.rows.length === 0) {
                done(null, false);
            } else {

                id_number = results.rows[0].id_no;

                var hash = results.rows[0].passwords.toString();
                bcrypt.compare(password, hash, function(err, res) {
                    if (res === true) {
                        return done(null, {
                            user_id: results.rows[0].id
                        });
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
    //console.log(id_number);

    client.query('select user_id_no, t.id, works from todo t, users where user_id_no = id_no and user_id_no = $1', [id_number], (err, result) => {
        //console.log(result.rows);

        if (err) {
            console.error('error running query', err);
            res.render('timeline-Index', {
                title: 'Something Wrong! Please Try Again!'
            });
        } else {
            res.render('timeline-Index', {
                data: result.rows
            });
        }
        //client.end();
    });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/timeline',
    failureRedirect: '/signUp'
}));

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/signUp');
});


app.post('/register', [

    check('password', 'passwords must be at least 6 chars long and contain one number').isLength({
        min: 6
    }),
    check('rePassword').custom((value, {
        req
    }) => {
        if (value != req.body.password) {
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
                        if (error) throw error;

                        //console.log(result.rows[0].user_id);
                        //console.log(result);

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
    return function(req, res, next) {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/signUp');
    }
}

app.post('/addSolution', (req, res) => {

    const pblm_no = req.body.pblm_no;
    const pblm_name = req.body.pblm_name;
    const judge = req.body.judge;
    const user_id = req.body.user_id;
    const code = req.body.code;

    const client = new Client(conString);
    client.connect();

    client.query('INSERT INTO online_judge(pblm_no, pblm_name, judge, user_id, code) values($1, $2, $3, $4, $5)', [pblm_no, pblm_name, judge, user_id, code], (err, result) => {
        if (err) {
            console.error('error running query', err);
            res.redirect('timeline');
        } else {
            res.redirect('timeline');
            // res.render('timeline-Index', {
            //         title: 'Great! Item is Added!!'
            // });
        }

    });
});


app.post('/TodoItemAdd', (req, res) => {

    const works = req.body.works;
    const user_id_no = req.body.user_id_no;


    const client = new Client(conString);
    client.connect();

    client.query('INSERT INTO todo(works, user_id_no) values($1, $2)', [works, user_id_no], (err, result) => {
        if (err) {
            console.error('error running query', err);
            res.redirect('timeline');
        } else {
            res.redirect('timeline');
            // res.render('timeline-Index', {
            //         title: 'Great! Item is Added!!'
            // });
        }

    });
});

app.delete('/deleteTodo/:id', (req, res) => {

    const client = new Client(conString);
    client.connect();

    //console.log(req.params.id);

    client.query('Delete from todo t where t.id = $1 ', [req.params.id], (err, result) => {
        res.sendStatus(200);
    });
});

app.post('/search', (req, res) => {

    const searchKey = req.body.pblm_id_no;

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);

    // console.log(searchKey);
    // console.log(searchKey);

    client.query("select oj.pblm_no, oj.pblm_name, oj.judge, oj.code from online_judge oj where oj.pblm_no = $1 ", [searchKey] , (err, results) => {

        if (err) {
            console.log(err);
            res.render('timeline-index', {
                error: 'Something Wrong'
            });
        } else {
            res.render('timeline-index', {
                data2: results.rows
            });
        }

    });
});


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

/////// online Judge

app.get('/codeforce', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'codeforce' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('codeforce', {
                error: 'Something Wrong'
            });
        } else {
            res.render('codeforce-index', {
                data: results.rows
            });
        }
    });
});

app.get('/acm', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'acm' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('acm', {
                error: 'Something Wrong'
            });
        } else {
            res.render('acm-index', {
                data: results.rows
            });
        }
    });
});

app.get('/codechef', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'codechef' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('codechef', {
                error: 'Something Wrong'
            });
        } else {
            res.render('codechef-index', {
                data: results.rows
            });
        }
    });
});

app.get('/googlejam', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'googlejam' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('googlejam', {
                error: 'Something Wrong'
            });
        } else {
            res.render('googlejam-index', {
                data: results.rows
            });
        }
    });
});

app.get('/hackerrank', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'hackerrank' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('hackerrank', {
                error: 'Something Wrong'
            });
        } else {
            res.render('hackerrank-index', {
                data: results.rows
            });
        }
    });
});

app.get('/leetcode', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'leetcode' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('leetcode', {
                error: 'Something Wrong'
            });
        } else {
            res.render('leetcode-index', {
                data: results.rows
            });
        }
    });
});

app.get('/lightoj', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'lightoj' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('lightoj', {
                error: 'Something Wrong'
            });
        } else {
            res.render('lightoj-index', {
                data: results.rows
            });
        }
    });
});

app.get('/spoj', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'spoj' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('spoj', {
                error: 'Something Wrong'
            });
        } else {
            res.render('spoj-index', {
                data: results.rows
            });
        }
    });
});

app.get('/timues', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'timues' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('timues', {
                error: 'Something Wrong'
            });
        } else {
            res.render('timues-index', {
                data: results.rows
            });
        }
    });
});

app.get('/topcoder', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'topcoder' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('topcoder', {
                error: 'Something Wrong'
            });
        } else {
            res.render('topcoder-index', {
                data: results.rows
            });
        }
    });
});

app.get('/uri', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'uri' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('uri', {
                error: 'Something Wrong'
            });
        } else {
            res.render('uri-index', {
                data: results.rows
            });
        }
    });
});

app.get('/uva', (req, res) => {

    const client = new Client(conString);
    client.connect();
    //console.log(id_number);
    client.query("select oj.id, user_id, pblm_no, pblm_name, code from  online_judge oj where user_id = $1 and judge = 'uva' ",[id_number], (err, results) => {
        if (err) {
            console.log(err);
            res.render('uva', {
                error: 'Something Wrong'
            });
        } else {
            res.render('uva-index', {
                data: results.rows
            });
        }
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});









//
