var RSVP      = require('rsvp'),
    express   = require('express'),
    logger    = require('morgan'),
    seo       = require('mean-seo'),
    redis     = require('./lib/redis'),
    logFormat = process.env.LOG_FORMAT || 'short',
    appName   = process.env.APP_NAME || 'default';

var app       = express();

app.set('port', (process.env.PORT || 5000));

app.use(logger(logFormat));

//Handle robots
app.use(function (req, res, next) {
    if ('/robots.txt' == req.url) {
        res.type('text/plain')
        res.send("User-agent: *\nDisallow: /");
    } else {
        next();
    }
});

app.use(seo({
    cacheClient: 'redis', // Can be 'disk' or 'redis'
    cacheDuration: 2 * 60 * 60 * 24 * 1000, // In milliseconds
    redisUrl: redis.redisUrl
}));

app.get('/*', function(request, response) {
    var key = request.query['key'];

    redis.connect().then(function() {
        if (!key) {
            return redis.get(appName + ':current');
        }

        return RSVP.resolve(key);
    })
    .then(function(key) {
        return redis.get(appName + ':' + key);
    })
    .then(function(data) {
        if (data) {
            response.send(data);
        } else {
            response.status(404).send('Not Found');
        }
    })
    .catch(function(error) {
        console.log('Error retrieving data from Redis: ', reason);
    });
});

app.on('close', function() {
    redis.quit();
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
});
