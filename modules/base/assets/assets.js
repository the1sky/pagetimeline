/**
 * Created by nant on 2014/7/13.
 */

exports.version = '0.2';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'asserts types ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;
	var requestId_info = {};
	var requestId_size = {};
	var url_size_list = [];
	var _ = require( 'underscore' );

	browser.onResponseReceived( function(res){
		/*
		 if( res.response.timing ){
		 console.log( res.response.timing['requestTime'], res.response.timing['receiveHeadersEnd'], res.response.url );
		 }*/
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;

		if( /v=pagetimeline|about:blank|chrome:\/\//.test( url ) ) return;

		if( !requestId_info[requestId] ){
			requestId_info[requestId] = {}
		}
		requestId_info[requestId] = {
			'url':url, 'timestamp':timestamp, 'responseBody':response
		};
	} );

	browser.onDataReceived( function(res){
		var requestId = res['requestId'];
		var len = res['dataLength'];
		if( !requestId_size[requestId] ){
			requestId_size[requestId] = 0;
		}
		requestId_size[requestId] += len;
	} );

	browser.onLoadEventFired( function(){
		setTimeout( function(){
			calculate();
		}, timeout );
	} );

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} );

	function calculate(){
		calculateTypeCountSize();
		calculateSlowRequests();
		calculateBigRequests();
	}

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
			'baiduapp/json':['json'],
			'text/xml':['xml'],
			'image/jpg':['jpeg'],
			'application/x-shockwave-flash':['flash']
		} );

		_.each( requestId_info, function(value, requestId){
			var url = value.url;
			var responseBody = value.responseBody;
			if( !responseBody ) return;
			var mimeType = responseBody.mimeType;
			var mimeExt = mime.extension( mimeType );
			var contentLen = 0;

			if( responseBody.headers['Content-Length'] ){
				contentLen = parseFloat( responseBody.headers['Content-Length'] );
			}else if( requestId_size[requestId] != undefined ){
				contentLen = requestId_size[requestId];
			}
			if( !assertsInfo[mimeExt] ){
				assertsInfo[mimeExt] = {
					count:0, size:0, urls:[]
				}
			}
			assertsInfo[mimeExt].count++;
			assertsInfo[mimeExt].size += contentLen;
			assertsInfo[mimeExt].urls.push( url );
			totalRequests++;
			totalSize += contentLen;

			url_size_list.push( {url:url, size:contentLen} );

			if( /image/.test( mimeType ) ){
				if( !assertsInfo['image'] ){
					assertsInfo['image'] = {
						count:0, size:0, urls:[]
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
			pagetimeline.setMetric( 'total_size', totalSize );
		}

		_.each( assertsInfo, function(value, key){
			pagetimeline.setMetric( key + '_requests', value.count );
			pagetimeline.setMetric( key + '_size', value.size );
			_.each( value.urls, function(url){
				pagetimeline.addOffender( key + '_requests', url );
			} )
		} )
		pagetimeline.log( 'asserts types done in ' + (+new Date() - start ) + 'ms' );
	}

	/**
	 * slow top 5
	 */
	function calculateSlowRequests(){
		var script = getEntries.toString() + ';getEntries()';
		browser.evaluate( script, function(err, res){
			if( !err && res.result ){
				var result = res.result.value;
				var newResult = [];
				var len = result.length;
				for( var i = 0; i < len; i++ ){
					var item = result[i];
					if( !/v=pagetimeline|about:blank|chrome:\/\//.test( item.name) ){
						newResult.push( item );
					}
				}

				newResult.sort( function(x, y){
					if( x.duration > y.duration ){
						return -1;
					}else{
						return 1;
					}
				} );

				var count = 5;
				count = count < newResult.length ? count : newResult.length;
				pagetimeline.setMetric( 'slow_requests', count );
				_.forEach( newResult, function(item, index){
					if( index < count ){
						pagetimeline.addOffender( 'slow_requests', item.name + '    ' + item.duration );
					}
				} );
			}
		} );
	}

	/**
	 * big top 5
	 */
	function calculateBigRequests(){
		var compare = function(obj1, obj2){
			var val1 = obj1.size;
			var val2 = obj2.size;
			if( val1 < val2 ){
				return 1;
			}else if( val1 > val2 ){
				return -1;
			}else{
				return 0;
			}
		}
		url_size_list.sort( compare );

		var count = 5;
		count = count < url_size_list.length ? count : url_size_list.length;
		pagetimeline.setMetric( 'big_requests', count );
		_.forEach( url_size_list, function(item, index){
			if( index < count ){
				pagetimeline.addOffender( 'big_requests', item.url + '      ' + item.size );
			}
		} );
	}

	function getEntries(){
		return window.performance.getEntriesByType( 'resource' );
	}

	callback( false, {message:'add assets types done!'} );
}
