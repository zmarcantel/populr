//----------------------------------------------------------------------------------
// Module
//----------------------------------------------------------------------------------
var keen = require('keen.io');

//----------------------------------------------------------------------------------
// Module Level Variables
//----------------------------------------------------------------------------------

var   name          // of the project
    , identifier    // that keen sees
    , keys          // that keen needs
    , api;          // the keen client

exports.init = function(opts, two) {
    this.name = opts.name;
    this.identifier = opts.id;
    this.keys = opts.keys;

    // EDIT HERE: pass the arguments through to the `providers.provider` constructor
    this.api = keen.configure({
        'projectId': opts.identifier,
        'writeKey': opts.keys.write,
        'readKey': opts.keys.read,
        'masterKey': opts.keys.master
    });

    return exports;
};

exports.increment = function(token, descriptor) {
    console.log('[keen] incrementing ');

    var result = {
        'token': token
    };
    for (var i in descriptor) { result[i] = descriptor[i]; }

    var collection = descriptor.collection ? descriptor.collection : "redirect";

    // the function
    this.api.addEvent(collection, result, function(err, res) {
        if (err) {
            console.log("ERROR: could not increment '%s' collection!\n%s\n\n", collection, err);
        }
    });
};
