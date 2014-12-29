'use strict';

var RSVP    = require('rsvp'),
    url     = require("url"),
    redis   = require('redis');


function RedisClient() {
    this.redisUrl = url.parse(process.env.REDISTOGO_URL || '127.0.0.1:6379');
    this._initClient();
}

RedisClient.prototype._initClient = function() {
    var client = redis.createClient(this.redisUrl.port, this.redisUrl.hostname);
    if(this.redisUrl.auth){
        client.auth(this.redisUrl.auth.split(":")[1]);
    }
    this.client = client;
    this.connect();
};

RedisClient.prototype.connect = function() {

    var _this = this;

    _this.client.on('error', function(error) {
        console.log('Redis error: ' + error);
    });

    return new RSVP.Promise(function(resolve, reject) {
        _this.client.on('connect', function() {
            console.log('Connected to redis');
            resolve();
        });
    });
};

RedisClient.prototype.get = function(key) {
    var _this = this;
    return new RSVP.Promise(function(resolve, reject) {
        _this.client.get(key, function(error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    })
};

RedisClient.prototype.quit = function() {
    this.client.quit();
};



module.exports = new RedisClient(); 
