/**
 * Created by nant on 2014/7/13.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'ajax requests...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;
	var requestId_info = {};

	browser.onResponseReceived( function(res){
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;
		if( !requestId_info[requestId] ){
			requestId_info[requestId] = {}
		}
		requestId_info[requestId] = {
			'url':url,
			'timestamp':timestamp,
			'responseBody':response
		};
	} );

	browser.onLoadEventFired( function(res){
		setTimeout(function(){
			calculate();
		},timeout)
	});

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} );

	function calculate(){
		var start = +new Date()
		var _ = require( 'underscore' );
		var keyName = 'ajax';
		var assertsInfo = {
			count:0,
			size:0,
			urls:[]
		}

		_.each( requestId_info, function(value, key){
			var url = value.url;
			var responseBody = value.responseBody;
			var requestHeaders = responseBody ? responseBody['requestHeaders'] : null;

			if( requestHeaders && ( requestHeaders[ 'X-Requested-With'] == 'XMLHttpRequest' ) ){
				var contentLen = 0;
				if( responseBody.headers['Content-Length'] ){
					contentLen = parseFloat( responseBody.headers['Content-Length'] );
				}else{
					contentLen = 0;
				}

				assertsInfo.count++;
				assertsInfo.size += contentLen;
				assertsInfo.urls.push( url );
			}
		} );

		if( assertsInfo.count ){
			pagetimeline.setMetric( keyName + '_requests', assertsInfo.count );
			pagetimeline.setMetric( keyName + '_size', ( assertsInfo.size / 1024 ).toFixed( 2 ) + 'KB' );
			_.each( assertsInfo.urls, function(url){
				pagetimeline.addOffender( keyName + '_requests', url );
			} )
		}
		pagetimeline.log( 'ajax requests done in ' + (+new Date() - start ) + 'ms' );
	}

	callback( false, {message:'add ajax request'} );
}