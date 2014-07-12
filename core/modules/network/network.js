/**
 * Created by nant on 2014/7/12.
 */

exports.run = function(pagetimeline,callback){
	var requestId_info = {};

	var enableNetwork = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
		browser.send( 'Network.enable', {}, function(err, response){
			callback( err, response );
		} );
	};

	var addNetworkEventListener = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
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
			exports.out = requestId_info;
			pagetimeline.core['requests'] = requestId_info;
		} );

		browser.on('Network.responseReceived',function(data){
			var requestId = data['requestId'];
			var timestamp = data['timestamp'];
			var response = data.response;
			var url = response.url;
			if( !requestId_info[requestId] ){
				requestId_info[requestId] = {}
			}
			requestId_info[requestId] = {
				'url':url,
				'timestamp':timestamp,
				'responseBody':response
				};
			exports.out = requestId_info;
			pagetimeline.core['requests'] = requestId_info;
		});

		callback(false,{message:'add network event listener'});
	};

	var async = require('async');
	async.series([
			async.apply( enableNetwork, pagetimeline ),
			async.apply( addNetworkEventListener, pagetimeline )
		],function(err, result){
			callback(err, result);
		}
	)
}

exports.name = 'network';
exports.after = 'connectserver';
exports.output = null;
