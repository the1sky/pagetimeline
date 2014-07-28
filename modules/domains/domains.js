/**
 * Created by nant on 2014/7/13.
 */

exports.version = '0.1';
exports.name = 'domains';

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'domains ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
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
		setTimeout( function(){
			var start = +new Date();
			var domainInfo = {}
			var _ = require( 'underscore' );

			_.each( requestId_info, function(value, key){
				var url = value.url;
				var reg = /http[s]*:\/\/([^\/]*)/;
				var res = url.match( reg );
				if( res ){
					var host = res[1];
					if( !domainInfo[host] ){
						domainInfo[host] = 0;
					}
					domainInfo[host]++;
				}
			} );

			var domains = [];
			var maxRequestsDomain = "";
			var maxRequests = 0;
			_.each( domainInfo, function(value, key){
				domains.push( key );
				pagetimeline.addOffender( 'domains', key );
				if( value > maxRequests ){
					maxRequests = value;
					maxRequestsDomain = key;
				}
			} )
			pagetimeline.setMetric( 'domains', domains.length );
			pagetimeline.setMetric( 'max_requests_per_domain', maxRequestsDomain );
			pagetimeline.addOffender( 'max_requests_per_domain', maxRequests );

			pagetimeline.log( 'domains done in ' + (+new Date() - start ) + 'ms' );
		}, timeout );
	} );

	callback( false, {message:'add domain module done!'} );
}
