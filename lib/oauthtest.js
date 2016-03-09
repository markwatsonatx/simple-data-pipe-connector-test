'use strict';

var querystring = require('querystring');
var http = require('https');
var fs = require('fs');

var clientId = "8lp6YZ7X1LAc8IMoLa4RSOpGK";
var clientSecret = "M9mt3HmAVa2286rOeTWPRg7wiWnPKSt0UEcXPP5bm8923bRm3h";

var postData = "grant_type=client_credentials";
// An object of options to indicate where to post to
var postOptions = {
    host: 'api.twitter.com',
    port: '443',
    path: '/oauth2/token',
    method: 'POST',
    headers: {
        'Authorization': 'Basic '+new Buffer(clientId + ":" + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};

var postResponse = "";
var getResponse = "";

// Set up the request
var postRequest = http.request(postOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        postResponse += chunk;
    });
    res.on('end', function () {
        var accessToken = JSON.parse(postResponse).access_token;
        console.log("ACCESS TOKEN: " + accessToken);
        var getOptions = {
            host: 'api.twitter.com',
            port: '443',
            path: '/1.1/search/tweets.json?q=%40ibmwatson',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer '+accessToken
            }
        };
        var getRequest = http.request(getOptions, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                getResponse += chunk;
            });
            res.on('end', function () {
                console.log(JSON.parse(getResponse));
            });
        });
        getRequest.end();
    });
});

// post the data
postRequest.write(postData);
postRequest.end();

//var oauth =  new OAuth(
//    "https://api.twitter.com/oauth2/token",
//    "https://api.twitter.com/oauth2/token",
//    "8lp6YZ7X1LAc8IMoLa4RSOpGK",
//    "M9mt3HmAVa2286rOeTWPRg7wiWnPKSt0UEcXPP5bm8923bRm3h",
//    '1.0A',
//    "",
//    'HMAC-SHA1'
//);
//
////obtain an access token
//oauth.getOAuthAccessToken(
//    null,
//    null,
//    function(err, oauth_access_token, oauth_access_token_secret, results) {
//        if (err) {
//            console.error("authCallback > getOAuthAccessToken - error: ", err);
//            //return callback(err);
//        }
//        else {
//            console.log("HELLO");
//        }
//    }
//);