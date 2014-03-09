populr
======

url redirector, shortener, and manager with easily pluggable analytics

[Motivation and What It Is](#motivation)

[Quick Install](#quick-install)

#### Easy to Us

* [Admin Panel](#admin-panel)
* [User Tracking](#user-tracking)
* [Automated Device Tracking](#device-tracking)
* [Simple API](#api)

#### Plays Well With Others

* [Pluggable Analytics](#add-analytics-provider)
* [Pluggable Databases](#add-database)
* [Installing with nginx](#nginx)
* [Using Upstart](#upstart)


### Node Powered

Utilizes [express](http://expressjs.com) to provide a lightweight [API](#api) with blazing fast response times.

Serves up an [admin panel](#admin-panel), simple [cli-friendly](#curl-and-wget) API, and provides [redirection](#redirection) so your users always get what they came for.



### Redis Backed

The most simple and lightweight database for an application like this. If you already have a DB in production or wish to use something else, see [adding a database](#add-database).

Stores a `token --> url` mapping in `redis`. Just storing strings so storage demands are relatively low (even at millions of urls).

Oh, and disk failover is nice too.


### [Keen](http://keen.io) on Analytics

By default, `populr` uses `keen.io` for the analytics backer.

A few things went into this decision:

1. Easy to try for free (and reasonable member prices)
2. JSON-style, dynamic field, event objects
3. Easily queried using either a library or standard HTTP methods
  * [Chart generation](https://keen.io/docs/data-visualization/) is a major plus

These were the things that won me over. Now, they also support the standard web interface, funnels, etc.

The `analytics/providers/keen` module was designed to serve as an expressive template to be used in [adding any other backers](#add-analytics-provider).


Motivation
==========

* Wonder how many times your app has been downloaded?
* Concerned no one clicked the link in that email?
* Want to know how many people clicked the App Store link, but __didn't__ buy it?
* Have an app that is a thin-wrapper to another service's API and want analytics?
* ... and so many more

By using `populr` as a middleman, users get their data and you get yours.

Built with the intention of tracking download statistics, `populr` is designed to prioritize your user's connection while offering insights without reinventing the metaphorical analytics wheel.

Exposing the download process empowers you to see, understand, and target your audience. Metrics like referring site, location, user-account status, and device/browser allow you to better target advertising or discover a market you never anticipated.

URL shortening is a highly useful, but tag-along, feature. It's the same problem, url interception/mapping, but with tokenized URLs instead of readable ones.



Quick Install
=============

1. Clone the project
  * `cd /srv && git clone https://github.com/zmarcantel/populr && bower install`
2. [Install with nginx](#nginx)
  * `export NGINX_CONF=/etc/nginx`
  * `cp deploy/populr.nginx $NGINX_CONF/sites-available/populr`
  * `ln -s $NGINX_CONF/sites-available/populr $NGINX_CONF/sites-enabled/populr`
3. [Install with upstart](#upstart)
  * `cp deploy/populr.upstart /etc/init/populr.conf`
4. Reload nginx and service
  * `service populr start`
  * `service nginx reload`



API
===

Keeping things simple is the only way `populr` could stay nimble in connection speed as well as expandability.

#### GET /:id

A standard HTTP `GET` will initiate the redirect pipeline:

1. Look up url registered for `id`
  * This could be a shortned url or a path to some page/file
2. Respond to the user with a `301`
  * This is the redirect
  * Issues a `301` so caches and other optimizations do not skip the redirection
3. Push the event to the analytics backing
  * The event object is how you add fields to run metrics on
  * Trivial to support analytic backends that do not support event objects


#### POST /create[?short=true]

Create a new mapping.

The `short` parameter is optional.

To generate a shortened url supply the query parameter `short=true`. Supplying `short=false` works as expected.

###### Post Body

The post body should look as follows.

````json
{
    "url": "String -- the url to redirect to"
}
````

###### Response

The response to a `POST` (if successful) returns the following

````json
{
    "url": "String -- the full qualified (http://example.com/abc) url to distribute"
}
````

_Error Codes_: `500`


#### GET /admin

See [Admin Panel](#admin-panel)


User Tracking
-------------

Given that you want to track individual 'users', I am going to assume you have some application that implements the notion of a 'user'.

There are two approaches here:

### Sessions

Sessions simply refers to using a cookie to issue (and save) some user's session as both verification and identification.

Thus, you have two options on how to host `populr` while also sending the session cookie.

1. on a subdomain
  * redirect.example.com
  * redirect to the root domain (example.com) in URLs
2. give it a path in your API
  * push all redirects through example.com/redirect/abd

Once you are sure the cookie is being issued, simply add any user data you want/have to the analytics event object.

The event modification as well as the user retrieval/serialization should be done in the `increment` function within the provider you are using.

````js
exports.increment = function(req, descriptor) {
    // setup and standard object fields

    // get the user data
    var user = lookupUser(req.user.userId); // this depends on your implementation
    result.name = user.name;
    result.location = user.location;
    result.deviceId = user.device;

    // pushing of event object
}
````



### URL paramater or other

This will vary wildly based on implementation.

Similar to the case of sessions above, the `increment` function is where user lookup should be happening.

The function is passed the Express [request object](http://expressjs.com/api.html#req.params) where you can differentiate the user by parsing the url parameters, any routing variables, or really any method of identification that's possible.


Device Tracking
---------------

Even without user data, we can gain a lot of insight about the user immediately.

The HTTP user-agent allows for determining

1. Mobile or Tablet or Desktop
  * and what version i.e. iOS 7.0.4, Android 4.4, OSX 10.9, Windows XP
2. How Many Times
  * a uuid is generated as a unique device/client/browser id
  * view count of each token (stored as token, not url) is included in the cookie
3. Which Browser
4. Their General Location (using IP address)


cUrl and wget
-------------

### cUrl

The definitive HTTP utility plays quite nicely.

`curl -d "url=google.com" "http://example.com/create?short=true"`


### wget

wget likes to do some redirecting too.

`wget --post-data="url=google.com" "http://example.com/create?short=true"`



Admin Panel
------------

The admin panel offers an array of analytics graphs as well as the ability to create redirects through a browser (which is definitely better than the command line).

___NOTE:___ The analytics views within the admin panel are available only if using the default, `keen.io`. I will gladly accept pull requests for panels using other analytic backings.


#### Accessing

The panel can be accessed on desktop or mobile at

    example.com/admin

but if you wish to view the details of a specific token, use the query parameter `token`:

    example.com/admin?token=A77

#### Default Analytics

Baked into the admin panel are

* Total + Weekly
  * Redirect count
  * Unique pages redirected to
  * Unique viewers
  * Number of browsers
* Time-Series (Week-period, daily interval)
  * Number of views to token(s)
  * Number of unique viewers
  * Unique pages redirected to (if not in single-token view)
* Pie Graphs
  * Family + Version
    * OS
    * Browser

Add Analytics Provider
======================

#### Quick Guide

1. Duplicate `keen.js` in `analytics/providers` and name it appropriately
2. Replace the `init()` and `increment()` functions within that file
4. Replace `require(keen).init` with your init function


#### The `analytics` Wrapper


The `analytics` module in the root directory implements a simple class (below).

````js
var Client = Class({
    //
    // constructor
    // do any initialization here
    //
    , init: function() {
        // this function is called with the arguments passed to it in app.js
    }


    //
    //  triggered by a user visiting the watched URL
    //
    , increment: function() {
        //  sends whatever signal is needed to the analytics API of choice that increments the count
        //  the function is provided with whatever arguments are called from 'analytics.increment()'
        //      the default arguments are (url, eventObject)
    }
});
````

It acts as a __thin__ wrapper to the provider modules in `analytics/providers`.

#### Analytics Provider

Adding a new analytics provider simply entails hooking up a new module that looks like:

````js
// load modules

// do any config, connection pooling, etc
exports.init = function(arguments) {
    // the arguments here can be whatever you need
    // HOWEVER, the 'analytics' module passes its arguments along
    // this means whatever is passed to 'analytics.init()' ends up here
}

// this functions is responsible for sending the event to analytics backer
// that process varies wildly so consult the docs
exports.increment = function(arguments) {
    // same to above as far as arguments
}
````


Add Database
============

Adding a database provider is fairly simple.

The current algorithm (redis) looks like so:

1. Atomic increment and fetch count of registered redirects
2. Convert count into base(62) using the [a-z,A-Z,0-9] alphabet
3. Store a map of base(62) -> target url

#### Implementing the Interface

The file `lib/redis.js` works as a template for any other database.

````js
// module loading

// this is the initializing function of the module
module.exports = function(generator, options) {
    // connection and/or pooling
    // STORE THE GENERATOR
}

// this function generates a url
// the shorten argument is a boolean determining if it should be shortened
exports.setUrl = function(target, shorten, callback) {
    // use the generator above (or not) to generate a url
    // callback in form of callback(err, url)
}

// this function returns the target url for a token in a json object
exports.getUrl = function(token, callback) {
    // looks up the entry for 'token'
    // callback(err, { url: 'example.com' })
}
````


nginx
=====

Follow this guid to [proxy with apache](http://thatextramile.be/blog/2012/01/hosting-a-node-js-site-through-apache) instead.

Proxying a `node` app with `nginx` is fairly simple.

Once you've installed nginx, use the example config in `deploy/populr.nginx` to host your app.

    export NGINX_CONF=/etc/nginx
    cp deploy/populr.nginx $NGINX_CONF/sites-available/populr
    ln -s $NGINX_CONF/sites-available/populr $NGINX_CONF/sites-enabled/populr

A next step is to [use upstart](#upstart) to keep the app alive through reboots and such.



upstart
=======

Upstart is the process/service manager included in Ubuntu.

The process is the same for others (launchd, systemd, systemvinit) but the config differs from one to the next.

Copy the example upstart script from `deploy/populr.upstart` to the correct location, typically `/etc/init/`

    cp deploy/populr.upstart /etc/init/populr

You will need to edit a few variables to fit your installation

    API_DIR            // this is the path app.js is located in
    set(u|g)id         // these two variables set the user/group respectively
                       // not mandatory, but a highly suggested security measure for all services

The service can now be run via

    service populr (start | stop | restart)

And made to start on reboot

    service populr enable
