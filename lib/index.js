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

	 /* 
	  * Customization is mandatory
	  */

	//// TODO:
	////   Replace 'template' with a unique connector id (Should match the value of property "simple_data_pipe"."name" in package.json)
	////   Replace 'Sample Data Source' with the desired display name of the data source (e.g. reddit) from which data will be loaded
	//var connectorInfo = {
	//					  id: 'test',			    // internal connector ID
	//					  name: 'My test connector'	// connector display name
	//					};
    //
	//// TODO
	//var connectorOptions = {
	//				  		recreateTargetDb: true, // if set (default: false) all data currently stored in the staging database is removed prior to data load
	//				  		useCustomTables: true   // keep true (default: false)
	//					   };
    //
	//// Call constructor from super class;
	//connectorExt.call(this,
	//				 connectorInfo.id,
	//				 connectorInfo.name,
	//				 connectorOptions
	//				 );

	connectorExt.call(this, connUtil.metadata.id, connUtil.metadata.label);

	///*
	// * Customization is mandatory!
	// * @return list of data sets (also referred to as tables for legacy reasons) from which the user can choose from
	// */
	//this.getTables = function(){
    //
	//	var dataSets = [];
    //
	//	// TODO: 'Define' the data set or data sets that can be loaded from the data source. The user gets to choose one.
	//	// dataSets.push({name:'dataSetName', labelPlural:'dataSetName'}); // assign the name to each property
    //
	//	/*
	//	 * In this example the data source contains several static data sets - transcripts of the victory speeches of
	//	 * the Republican and Democratic 2016 presidential candidates.
	//	 */
    //
	// 	// set data set location
	// 	var sampleDataDir = path.join(__dirname,'..','sample_data' + path.sep);
    //
	// 	// load data set metadata file
	// 	var transciptListings;
	// 	try {
	//			transciptListings = require(sampleDataDir + 'transcriptListings.json');
	// 	}
	// 	catch(e) {
	// 		// only triggered by a code logic or packaging error; return empty data set list
	// 		return dataSets;
	// 	}
    //
	// 	// retrieve listings and verify that a transcript file is available
 	//	var fileStat;
	//	_.forEach(transciptListings,
	//	 		  function (listing) {
	//	 		  						// verify that the transcript file exists
	//									fileStat = fs.statSync(sampleDataDir + listing.transcript);
	//									if (fileStat && !fileStat.isDirectory()) {
	//										    dataSets.push(
	//										    				{
	//										    					name: listing.transcript_id,
	//										    					labelPlural:listing.transcript_id
	//										    				});
	//									 }
	// 			  }
	// 	);
    //
	//	// Sometimes you might want to provide the user with the option to load all data sets concurrently
	//	// To enable that feature, define a single data set that contains only property 'labelPlural'
	//	dataSets.push({labelPlural:'All victory speeches'});
    //
	//	// In the UI the user gets to choose from:
	//	//  -> All data sets
	//	//  -> sample data set 1
	//	//  -> ...
    //
	//	// sort list; if present, the ALL_DATA option should be displayed first
	//	return dataSets.sort(function (dataSet1, dataSet2) {
	//															if(! dataSet1.name)	{ // ALL_DATA (only property labelPlural is defined)
	//																return -1;
	//															}
    //
	//															if(! dataSet2.name) {// ALL_DATA (only property labelPlural is defined)
	//																return 1;
	//															}
    //
	//															return dataSet1.name - dataSet2.name;
	//														   });
    //
	//}; // getTables


	this.getTables = function() {
		return [
			{
				name: "@ibm",
				labelPlural: "@ibm"
			},
			{
				name: "@ibmanalytics",
				labelPlural: "@ibmanalytics"
			},
			{
				name: "@ibmwatson",
				labelPlural: "@ibmwatson"
			}
		];
	}
	/*
	 * Customization is not needed.
	 */
	this.getTablePrefix = function(){
		// The prefix is used to generate names for the Cloudant staging databases that hold your data. The recommended
		// value is the connector ID to assure uniqueness.
		return connectorInfo.id;
	};
	
	this.connectDataSource = function(req, res, pipeId, url, callback) {
		callback("Not required");
	};

	this.authCallback = function(oAuthCode, pipeId, callback, state) {
		callback("Not required");
	};

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
			});
		});
		postRequest.write(postData);
		postRequest.end();
	};

	this.fetchRecords = function(table, pushRecordFn, done, pipeRunStep, pipeRunStats, logger, pipe, pipeRunner) {
		var getOptions = {
			host: 'api.twitter.com',
			port: '443',
			path: '/1.1/search/tweets.json?q=%40ibmwatson',
			method: 'GET',
			headers: {
				'Authorization': 'Bearer '+accessToken
			}
		};
		var getResponse = "";
		var getRequest = http.request(getOptions, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				getResponse += chunk;
			});
			res.on('end', function () {
				pushRecordFn(JSON.parse(getResponse));
			});
			done();
		});
		getRequest.end();
	}

	///*
	// * Customization is mandatory!
	// * Implement the code logic to fetch data from the source, optionally enrich it and store it in Cloudant.
	// * @param dataSet - dataSet.name contains the data set name that was (directly or indirectly) selected by the user
	// * @param done(err) - callback funtion to be invoked after processing is complete
	// * @param pipe - data pipe configuration
	// * @param logger - a dedicated logger instance that is only available during data pipe runs
	// */
	//this.fetchRecords = function( dataSet, pushRecordFn, done, pipeRunStep, pipeRunStats, logger, pipe, pipeRunner ){
    //
	//	// The data set is typically selected by the user in the "Filter Data" panel during the pipe configuration step
	//	// dataSet: {name: 'data set name'}. However, if you enabled the ALL option (see get Tables) and it was selected,
	//	// the fetchRecords function is invoked asynchronously once for each data set.
    //
	//	// Bunyan logging - https://github.com/trentm/node-bunyan
	//	// The log file is attached to the pipe run document, which is stored in the Cloudant repository database named pipes_db.
	//	// To enable debug logging, set environment variable DEBUG to '*'' or 'to sdp-pipe-run' (withoiut the quotes).
	//	logger.debug('Fetching data set ' + dataSet.name + ' from cloud data source.');
    //
	//	// TODO: fetch data from cloud data source
	//	// in this sample the data source contains static data sets that are loaded from local files
    //
	//	// set data set location
	//	var sampleDataDir = path.join(__dirname, '..', 'sample_data' + path.sep);
    //
    //
	//	// load listings and lookup metadata
	//	var transciptListings = require(sampleDataDir + 'transcriptListings.json');
	//	var listing = _.find(transciptListings, function(listing){
	//		return (dataSet.name === listing.transcript_id);
	//	});
    //
	//	if(!listing) {
	//		// Invoke done callback function to terminate execution and pass an error message
	//		logger.error('The data set cannot be found.');
	//		return done('The data set cannot be found.');
	//	}
    //
	//	fs.readFile(sampleDataDir + listing.transcript, function(err, data) {
	//		if(err) {
	//			logger.error('The data set could not be loaded: ' + err);
	//			// Invoke done callback function to terminate execution and pass an error message
	//			return done('The data set could not be loaded: ' + err);
	//		}
    //
	//		var record = {
	//			winner: listing.winner,
	//			party: listing.party,
	//			location: listing.location,
	//			transcript: data.toString()
	//		};
    //
	//		/*
	//		 TODO: The results of a data pipe run are persisted in Cloudant by invoking pushRecordFn, passing a single record
	//		 {...} or multiple records [{...}].
	//		 One Cloudant database is created for each data set and named using the following algorithm:
	//		 getTablePrefix() + dataSet.name.
	//		 The total number of records is automatically calculated if this function is invoked multiple times.
	//		 */
    //
	//		//
	//		// Parameter: pass a single record or a set of records to be persisted
	//		//
	//		pushRecordFn(record);
    //
	//		// Invoke done callback to indicate that data set dataSet has been processed.
	//		// Parameters:
	//		//  done()                                      // no parameter; processing completed successfully. no status message text is displayed to the end user in the monitoring view
	//		//  done({infoStatus: 'informational message'}) // processing completed successfully. the value of the property infoStatus is displayed to the end user in the monitoring view
	//		//  done({errorStatus: 'error message'})        // a fatal error was encountered during processing. the value of the property infoStatus is displayed to the end user in the monitoring view
	//		//  done('error message')                       // deprecated; a fatal error was encountered during processing. the message is displayed to the end user in the monitoring view
	//		return done();
    //
	//	});
	//}; // fetchRecords
}

//Extend event Emitter
require('util').inherits(sampleConnector, connectorExt);

module.exports = new sampleConnector();