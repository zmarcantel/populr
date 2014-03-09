'use strict';

//----------------------------------------------------------------------------------
// Modules
//----------------------------------------------------------------------------------

var   express = require('express')
    , http = require('http')
    , path = require('path')
    , url = require('url')
    , uagent = require('ua-parser')
    , uuid = require('uuid');

//----------------------------------------------------------------------------------
// EDIT THESE VARIABLES
//----------------------------------------------------------------------------------
var   BASE_URL = 'http://localhost:3000';

// programmatically generate the alphabet
// eases modification and removes the static data from source
var alphabet = [];
(function() {
    for (var i = 'a'; i < 'z'; i++) { alphabet.push(i); }
    for (var m = 'A'; m < 'Z'; m++) { alphabet.push(m); }
    for (var n = '0'; n < '9'; n++) { alphabet.push(n); }
})();

//----------------------------------------------------------------------------------
// Analytics Setup
// EDIT THIS SECTION
//----------------------------------------------------------------------------------

// secrets.json is a file ignored by git that holds the keys to the keen.io API
// you are not required to do this, but it is good practice NOT to push secrets to version control
var   keenSecrets = require('./secrets.json')
    , keenProject = keenSecrets.project;

var analytics = require('./analytics')({
      'name': 'keen'
    , 'identifier': keenProject

    // NOTE: the analytics module actually sees this entry as { read: '', write: '', master: '' } with real values
    , 'keys': keenSecrets.keys
});

//----------------------------------------------------------------------------------
// Redis Setup
// DO NOT EDIT THIS SECTION -- unless you know you want/need to
//----------------------------------------------------------------------------------

var db = require('./lib/redis')(tokenGenerator, {
      'host': 'localhost'               // default
    , 'port': '6379'                    // default
    , 'connect_timeout': 5000           // wait 5 seconds for connection
    , 'max_attempts': 5                 // but if after 5 (or 25s) just fail
    , 'enable_offline_queue': true      // if we are disconnected, allow events to queue
    , 'auth_pass': null                 // would contain the password for auth if needed
});


//----------------------------------------------------------------------------------
// Route Handlers
// EDIT THIS SECTION CAREFULLY
//----------------------------------------------------------------------------------

//
// Redirect a request to an external (or internal!) url after looking
// up the valid url given the shortened identifier
//

function redirect(req, res) {
    // get the actual url for the 'id' we created previously
    db.getUrl(req.params.id, function (err, url) {
        if (err) {
            // safer and more secure to just 404 here
            // feel free to add your own expanded error handler
            res.json(404);
        }

        // create the user agent parser
        var agentString = req.headers['user-agent'];
        var parser = uagent.parse(agentString);

        // handle count cookie
        // generates a field 'uniqueId' with a uuid for this device/client
        // generates a field with the token of the parmater ':id' and the value of number of views
        // if the cookie exists, increment the view count
        var cookies = parseCookies(req.headers.cookie);
        if (!cookies.uniqueId) {
            cookies.uniqueId = uuid.v1();
            res.cookie('uniqueId', cookies.uniqueId);
        }
        if (!cookies[req.params.id]) {
            cookies[req.params.id] = 1;
        } else { cookies[req.params.id] = parseInt(cookies[req.params.id], 10) + 1; }
        res.cookie(req.params.id, cookies[req.params.id]);

        // 301 so savvy clients do not try to skip us
        res.redirect(301, url);

        // increment the count of redirects
        // the event is sent with the field 'token' being set to the first argument
        analytics.increment(req.params.id, {
              'collection': 'redirect'
            , 'IP': req.ip
            , 'isXHR': req.xhr
            , 'redirect': url
            , 'views': cookies[req.params.id]
            , 'uniqueId': cookies.uniqueId
            , 'device': {
                  'browser': parser.ua.family
                , 'browserVersion': parser.ua.toVersionString() + ' (' + parser.ua.family + ')'
                , 'os': parser.os.family
                , 'osVersion': parser.os.toVersionString() + ' (' + parser.os.family + ')'
            }
        });
    });
}




//----------------------------------------------------------------------------------
// ONLY EDIT BELOW HERE IF YOU'RE GOING BEYOND STANDARD FEATURES
//----------------------------------------------------------------------------------


//
// Create a new shortened url
// A POST to this function will result in a "{BASE_URL}/{SHORT}" string being returned in res.url
//

function create(req, res) {
    // if no url is provided in the POST body, respond with error
    // also "log" to analytics point under 'failures' collection
    if (!req.body || !req.body.url) {
        res.json(400, {
            'error': 'POST body must contain field: url'
        });
        analytics.increment(req.path, {
              'collection': 'failures'
            , 'IP': req.ip
            , 'isXHR': req.xhr
            , 'why': 'no url'
        });
        return;
    }

    // dress up the url to make sure it's formatted correctly
    // then store it in the db
    db.setUrl(req.body.url, req.query.short, function(err, shortUrl) {
        if (err) {
            res.json(500, {
                'errorMessage': err
            });
            return;
        }

        res.json(201, {
            'url': url.resolve(BASE_URL, shortUrl)
        });

        // count the completion
        analytics.increment(req.path, {
              'collection': 'created'
            , 'IP': req.ip
            , 'isXHR': req.xhr
            , 'shortened': shortUrl
        });
    });
}


//
// Render the administration page
// Allows creation of new urls via browser
// Also, if using the keen.io standard backing, analytics are summarized
//
// A query parameter (/admin?token=aaa) renders the admin panel, but limited to that token
//

function admin(req, res) {
    res.render('admin', {
          title: BASE_URL
        , token: req.query.token ? req.query.token : ''
        , analytics: {
              identifier: keenProject
            , keys: keenSecrets.keys
        }
    });
}



//----------------------------------------------------------------------------------
// Express Server Setup
//----------------------------------------------------------------------------------

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/admin',       admin);         // get to the admin panel
app.get('/:id',         redirect);      // a token wil redirect
app.post('/create',     create);        // a post with field 'url' in body

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


//----------------------------------------------------------------------------------
// Utility Functions
//----------------------------------------------------------------------------------


//
// The generator function for the tokens
// Uses the alphabet above to convert the total count of urls in DB
//    to a token of BASE(alphabet.length) using the given alphabet as encoding
//
// a-z + A-Z + 0-9 = 62
// tokens are thus BASE(62) encoded
//
function tokenGenerator (count) {
    var num = count;

    var chars = [];
    while ( num > 0 ) {
        chars.push( alphabet[num % alphabet.length] );
        num = parseInt(num / alphabet.length, 10);
        console.log(num,' : ',alphabet[num % alphabet.length]);
    }
    return chars.reverse().join('');
}


function parseCookies (cookie) {
    var list = {};

    cookie && cookie.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
}
