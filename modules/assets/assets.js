/**
 * Created by nant on 2014/7/13.
 */

exports.version = '0.2';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'asserts types ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var requestId_info = {};
	var _ = require('underscore');

	browser.onResponseReceived( function(res){
		if( res.response.timing ){
			console.log( res.response.timing['requestTime'], res.response.timing['receiveHeadersEnd'], res.response.url );
		}
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;

		if( /v=pagetimeline/.test( url ) ) return;

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
		setTimeout( function(){
			calculateTypeCountSize();
			calculateSlowestRequests();
		}, timeout );
	} );

	function calculateTypeCountSize(){
		var start = +new Date();
		var mime = require( 'mime' );
		var assertsInfo = {}
		var _ = require( 'underscore' );
		var totalRequests = 0;
		var totalSize = 0;
		mime.define( {
			'text/javascript':['js'],
			'application/x-javascript':['js'],
			'text/json':['json'],
			'text/xml':['xml'],
			'image/jpg':['jpeg'],
			'application/x-shockwave-flash':['flash']
		} );

		_.each( requestId_info, function(value, key){
			var url = value.url;
			var responseBody = value.responseBody;
			if( !responseBody ) return;
			var mimeType = responseBody.mimeType;
			var mimeExt = mime.extension( mimeType );
			var contentLen = 0;

			if( responseBody.headers['Content-Length'] ){
				contentLen = parseFloat( responseBody.headers['Content-Length'] );
			}else{
				contentLen = 0;
			}
			if( !assertsInfo[mimeExt] ){
				assertsInfo[mimeExt] = {
					count:0,
					size:0,
					urls:[]
				}
			}
			assertsInfo[mimeExt].count++;
			assertsInfo[mimeExt].size += contentLen;
			assertsInfo[mimeExt].urls.push( url );
			totalRequests++;
			totalSize += contentLen;

			if( /image/.test( mimeType ) ){
				if( !assertsInfo['image'] ){
					assertsInfo['image'] = {
						count:0,
						size:0,
						urls:[]
					}
				}
				assertsInfo['image'].count++;
				assertsInfo['image'].size += contentLen;
				assertsInfo['image'].urls.push( url );
			}
		} );

		if( totalRequests > 0 ){
			pagetimeline.setMetric( 'total_requests', totalRequests );
		}
		if( totalSize > 0 ){
			pagetimeline.setMetric( 'total_size', ( totalSize / 1024 ).toFixed( 2 ) + 'KB' );
		}

		_.each( assertsInfo, function(value, key){
			pagetimeline.setMetric( key + '_requests', value.count );
			pagetimeline.setMetric( key + '_size', ( value.size / 1024 ).toFixed( 2 ) + 'KB' );
			_.each( value.urls, function(url){
				pagetimeline.addOffender( key + '_requests', url );
			} )
		} )
		pagetimeline.log( 'asserts types done in ' + (+new Date() - start ) + 'ms' );
	}

	/**
	 * top 5
	 */
	function calculateSlowestRequests(){
		var script = getEntries.toString() + ';getEntries()';
		browser.evaluate( script, function(err, res){
			if( !err && res.result ){
				res.result.value.sort(function(x,y){
					if( x.duration > y.duration ){
						return -1;
					}else{
						return 1;
					}
				});

				var count = 5;
				pagetimeline.setMetric( 'slowest_requests', count );
				_.forEach( res.result.value,function(item,index){
					if( index < count ){
						pagetimeline.addOffender( 'slowest_requests', item.name + '    ' + item.duration );
					}
				});
				console.log( res.result );
			}
		} );
	}

	function getEntries(){
		return window.performance.getEntriesByType( 'resource' );
	}

	callback( false, {message:'add assets types done!'} );
}
