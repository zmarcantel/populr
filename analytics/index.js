//----------------------------------------------------------------------------------
// Import any modules you need here
//----------------------------------------------------------------------------------
var   Class = require('../lib/node.class.js');

//----------------------------------------------------------------------------------
// Class descriptor for an abstract analytics handler
// This is intended to be a very thin wrapper simply to abstract any given
//    analytics module into an increment (more fucntions to come?) method
// By maintaining this thin wrapper, you are free to hook into all parts of the
//    analytics client's workflow -- logging, situational conditions, etc
//----------------------------------------------------------------------------------
var Client = Class({
      'provider': Object

    // constructor
    , init: function() {
        this.provider = require('./providers/keen.js').init.apply(null, argumentsArray(arguments[0]));
    }


    //
    //  Triggered by a user visiting the watched URL
    //  Sends whatever signal is needed to the analytics API of choice that increments the count
    //  The function is provided with the url that triggered this event
    //
    , increment: function() {
        this.provider.increment.apply(null, argumentsArray(arguments));
    }
});


//----------------------------------------------------------------------------------
// Module Functions
//----------------------------------------------------------------------------------

//
// Initialize module and return a new instance of Client
//

module.exports = function() {
    var client = new Client(arguments);

    return client;
};


//
// Create an array of arguments (for .apply())
// rather than an index:value map
//

function argumentsArray(args) {
    var result = [];
    for (var i in args) {
        result.push(args[i]);
    }
    return result;
}
