var RSVP      = require('rsvp'),
    express   = require('express'),
    logger    = require('morgan'),
    seo       = require('mean-seo'),
    redis     = require('./lib/redis'),
    logFormat = process.env.LOG_FORMAT || 'short',
    appName   = process.env.APP_NAME || 'default',
    env       = process.env.NODE_ENV || 'development';

var app       = express();

var forceSSL  = function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
};

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

if (env === 'production') {
    app.use(seo({
        cacheClient: 'redis', // Can be 'disk' or 'redis'
        cacheDuration: 2 * 60 * 60 * 24 * 1000, // In milliseconds
        redisURL: redis.redisUrl
    }));

    app.use(forceSSL);

}

app.get('/*', function(request, response) {
    var key = request.query['key'];

    var promise = new RSVP.Promise(function(resolve) {
        if (!key) {
            return resolve(redis.get(appName + ':current'));
        }

        return resolve(appName + ':' + key);
    }).then(function(key) {
        return redis.get(key);
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
