//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2015
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------

'use strict';

var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var http = require('https');

var connectorExt = require('simple-data-pipe-sdk').connectorExt;
var connUtil = require('./connectorUtil.js').ConnectorUtil;

/**
 * Sample connector that stores a few JSON records in Cloudant
 * Build your own connector by following the TODO instructions
 */
function sampleConnector( parentDirPath ){

	connectorExt.call(this, connUtil.metadata.id, connUtil.metadata.label);

	this.getTables = function() {
		return [
			{
				name: "ibm",
				labelPlural: "ibm"
			},
			{
				name: "ibmanalytics",
				labelPlural: "ibmanalytics"
			},
			{
				name: "ibmwatson",
				labelPlural: "ibmwatson"
			}
		];
	}

	/*
	 * Customization is not needed.
	 */
	this.getTablePrefix = function(){
		// The prefix is used to generate names for the Cloudant staging databases that hold your data. The recommended
		// value is the connector ID to assure uniqueness.
		return connUtil.metadata.id;
	};
	
	//this.connectDataSource = function(req, res, pipeId, url, callback) {
	//};
    //
	//this.authCallback = function(oAuthCode, pipeId, callback, state) {
	//};

	this.doConnectStep = function(done, pipeRunStep, pipeRunStats, logger, pipe, pipeRunner) {
		var postAuth =  new Buffer(pipe.clientId + ":" + pipe.clientSecret).toString('base64');
		var postData = "grant_type=client_credentials";
		var postOptions = {
			host: 'api.twitter.com',
			port: '443',
			path: '/oauth2/token',
			method: 'POST',
			headers: {
				'Authorization': 'Basic '+postAuth,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length
			}
		};
		var postResponse = "";
		var postRequest = http.request(postOptions, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				postResponse += chunk;
			});
			res.on('end', function () {
				var accessToken = JSON.parse(postResponse).access_token;
				pipe.oauth = {
					oauth_access_token: accessToken,
					oauth_access_token_secret: null
				};
				done();
			});
		});
		postRequest.write(postData);
		postRequest.end();
	};

	this.fetchRecords = function(table, pushRecordFn, done, pipeRunStep, pipeRunStats, logger, pipe, pipeRunner) {
		var getOptions = {
			host: 'api.twitter.com',
			port: '443',
			path: '/1.1/search/tweets.json?q=' + encodeURIComponent("@"+table.name),
			method: 'GET',
			headers: {
				'Authorization': 'Bearer '+pipe.oauth.oauth_access_token
			}
		};
		var getResponse = "";
		var getRequest = http.request(getOptions, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				getResponse += chunk;
			});
			res.on('end', function () {
				var twitterResponse = JSON.parse(getResponse);
				if (twitterResponse && twitterResponse.statuses && twitterResponse.statuses.length > 0) {
					pushRecordFn(twitterResponse.statuses);
				}
				done();
			});
		});
		getRequest.end();
	}
}

//Extend event Emitter
require('util').inherits(sampleConnector, connectorExt);

module.exports = new sampleConnector();