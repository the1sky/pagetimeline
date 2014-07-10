/**
 * Created by nant on 2014/7/9.
 */

exports.version = '0.1';

exports.browser = null;
exports.startTime = 0;
exports.requests = null;
exports.records = null;
exports.module = function(pagetimeline, callback){
	var async = require( 'async' );
	var Chrome = require( 'chrome-remote-interface' );
	var requestId_info = {};
	var request_info = {};
	var records = [];

	var judgeConnected = function(pagetimeline, Chrome, callback){
		var port = pagetimeline.getParam('port');
		Chrome( {host:'localhost', port:port}, function(chrome){
			if( !chrome ){
				callback( true, {'message':'not connected to browser!'} );
			}else{
				callback( false, {browser:chrome} );
			}
		} );
	};

	var enablePage = function(pagetimeline, browser, callback){
		browser.send( 'Page.enable', {}, function(err, response){
			callback( err, response );
		} );
	};

	var enableNetwork = function(pagetimeline, browser, callback){
		browser.send( 'Network.enable', {}, function(err, response){
			callback( err, response );
		} );
	};

	var enableRuntime = function(pagetimeline, browser, callback){
		browser.send( 'Runtime.enable', {}, function(err, response){
			callback( err, response );
		} );
	};

	var startTimeline = function(pagetimeline, browser, callback){
		browser.send( 'Timeline.start', {}, function(err, response){
			callback( err, response );
		} );
	};

	var addNetworkEventListener = function(pagetimeline, browser, callback){
		browser.on( 'Network.requestWillBeSent', function(message){
			var requestId = message.requestId;
			var url = message.request.url;
			if( !requestId_info[requestId] ){
				requestId_info[requestId] = {
					'url':url
				}
			}
		} );

		browser.on( 'Network.loadingFinished', function(data){
			var requestId = data['requestId'];
			var timestamp = data['timestamp'];
			if( !requestId_info[requestId] ){
				requestId_info[requestId] = {}
			}
			requestId_info[requestId]['timestamp'] = timestamp;
		} );
		callback(false,{message:'add network event listener'});
	};

	var addTimelineEventListener = function(pagetimeline, browser, callback){
		browser.on( 'Timeline.eventRecorded', function(record){
			records.push( record.record );
		} );
		callback( false, {message:'add eventRecorded event listener'} );
	};

	var openPage = function(pagetimeline, browser, callback){
		var startTime = +new Date();
		exports.startTime = startTime;
		browser.send( 'Page.navigate', {'url':pagetimeline.url}, function(err, response){
			if( !err ){
				callback( err, {'startTime':startTime} );
			}else{
				callback( err, response );
			}
		} );
	};

	async.series( [async.apply( judgeConnected, pagetimeline, Chrome )], function(err, result){
		if( !err ){
			var browser = result[0].browser;
			exports.browser = browser;
			async.auto( {
				enablePage:async.apply( enablePage, pagetimeline, browser ),
				enableNetwork:async.apply( enableNetwork, pagetimeline, browser ),
				enableRuntime:async.apply( enableRuntime, pagetimeline, browser ),
				startTimeline:async.apply( startTimeline, pagetimeline, browser ),
				addNetworkEventListener:['enableNetwork', async.apply( addNetworkEventListener, pagetimeline, browser )],
				addTimelineEventListener:['startTimeline', async.apply( addTimelineEventListener, pagetimeline, browser ) ],
				openPage:['enablePage', 'enableRuntime', 'addNetworkEventListener', 'addTimelineEventListener', async.apply( openPage, pagetimeline, browser )]
			}, function(err, result){
				 setTimeout( timeoutProcess, pagetimeline.getParam('timeout'), pagetimeline,callback );
			} )
		}else{
			callback( err, result );
		}
	} );

	function timeoutProcess(pagetimeline,callback){
		sortNetwork( pagetimeline );
		getRecords( pagetimeline );
		getHar();
		callback( false, { message:'calculate network and timeline information',
						    records:exports.records,
							browser:exports.browser,
							requests:exports.requests,
							startTime:exports.startTime} );
	}

	function sortNetwork(pagetimeline){
		for( var requestId in requestId_info ){
			var requestInfo = requestId_info[requestId];
			var url = requestInfo['url'];
			var timestamp = requestInfo['timestamp'];
			if( timestamp && !request_info[url] ){
				request_info[url] = timestamp;
			}
		}
		exports.requests = request_info;
	}

	function getRecords(pagetimeline){
		exports.records = records;
	}

	function getHar(){
	}
}
