'use strict';

//----------------------------------------------------------------------------------
// Modules
//----------------------------------------------------------------------------------

var   path = require('path')
    , redis = require('redis')
    , client;

//----------------------------------------------------------------------------------
// Module Level Variables
//----------------------------------------------------------------------------------

var generator;

//----------------------------------------------------------------------------------
// Initializer
//----------------------------------------------------------------------------------

module.exports = function(gen, opts) {
    if (!opts) {
        opts = {};
    }

    if (!gen || typeof gen != 'function') {
        console.log('ERROR: generator function required!');
        process.exit(1);
    } else {
        generator = gen;
    }

    // create the client with options
    client = redis.createClient(opts.port, opts.host, opts);

    // announce we're connected
    client.on("connect", function (err) {
        console.log("REDIS: connected");
    });

    // setup error handling
    client.on("error", function (err) {
        console.log("REDIS ERROR: %s\n\n", err);
    });

    // catch the connection terminating
    client.on("end", function () {
        console.log("REDIS: Connection terminated");
    });
    return exports;
};

//----------------------------------------------------------------------------------
// Module Functions
//----------------------------------------------------------------------------------

exports.setUrl = function(target, shorten, done) {
    if (!shorten) {
        var shortString = path.basename(target);
        client.set(shortString, target);
        done(null, shortString);
        return;
    }

    // automatically increment the count
    // this stops the count from ever being 0 where the generator would fail
    // if you change the generator, feel free to change this
    client.incr('count');

    // now fetch the count!
    // we need it to feed the generator
    client.get("count", function(err, count) {
        if (err) {
            done(err);
            return;
        }

        // get a token based on the count and the supplied generator
        // then store that value in the DB so that token --> url
        var shortString = generator(count);
        client.set(shortString, target);

        // and go back
        done(null, shortString);
    });
};

exports.getUrl = function(forUrl, done) {
    // simple enough!
    client.get(forUrl, done);
};
