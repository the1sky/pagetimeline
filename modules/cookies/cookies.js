/**
 * Created by nant on 2014/8/5.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add cookies module done!'} );

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var _ = require( 'underscore' );
	var urlModule = require( 'url' );

	// monitor cookies in HTTP headers
	var Collection = require( '../../libs/collection' );
	var cookiesDomains = new Collection();
	var cookies = [];

	pagetimeline.setMetric( 'cookies_count' );
	pagetimeline.setMetric( 'cookies_sent_size' ); // @desc length of cookies sent in HTTP requests @unreliable
	pagetimeline.setMetric( 'cookies_recv_size' ); // @desc length of cookies received in HTTP responses
	pagetimeline.setMetric( 'cookies_domains' ); // @desc number of domains with cookies set
	pagetimeline.setMetric( 'cookies_document_size' ); // @desc length of document.cookie
	pagetimeline.setMetric( 'cookies_document_count' ); //@desc number of cookies in document.cookie

	browser.onResponseReceived( function(res){
		var requestHeaders = res.response.requestHeaders;
		var responseHeaders = res.response.headers;
		var url = res.response.url;
		var domain = urlModule.parse( url ).host;

		_.forEach( requestHeaders, function(headerValue, headerName){
			switch( headerName.toLowerCase() ){
				case 'cookie':
					pagetimeline.incrMetric( 'cookies_sent_size', headerValue.length );
					cookiesDomains.push( domain );
					cookies.push( {domain:domain, value:headerValue} );
					break;
			}
		} );

		_.forEach( responseHeaders, function(headerValue, headerName){
			switch( headerName.toLowerCase() ){
				case 'set-cookie':
					var formatCookies = (headerValue || '').split( '\n' );
					formatCookies.forEach( function(cookie){
						pagetimeline.incrMetric( 'cookies_recv_size', cookie.length );
						cookiesDomains.push( domain );
						cookies.push( {domain:domain, value:cookie} );
					} );
					break;
			}
		} );
	} );

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			//cookies
			pagetimeline.setMetric( 'cookies_count', cookies.length );
			_.forEach( cookies, function(value, key){
				pagetimeline.addOffender( 'cookies_count', value.domain + ': ' + value.value );
			} );

			// domains with cookies
			cookiesDomains.forEach( function(domain, cnt){
				pagetimeline.incrMetric( 'cookies_domains' );
				pagetimeline.addOffender( 'cookies_domains', domain + ': ' + cnt + ' cookie(s)' );
			} );

			var script = getCookiesLen.toString() + ';getCookiesLen()';
			browser.evaluate( script, function(err, res){
                if( res && res.result ){
				    pagetimeline.setMetric( 'cookies_document_size', res.result.value );
                }
			} );

			script = getCookiesCount.toString() + ';getCookiesCount()';
			browser.evaluate( script, function(err, res){
                if( res && res.result ){
				    pagetimeline.setMetric( 'cookies_document_count', res.result.value );
                }
			} );
		}, timeout );
	} );

	function getCookiesLen(){
		try{
			return document.cookie.length;
		}catch( ex ){
			return 0;
		}
	}

	function getCookiesCount(){
		try{
			return document.cookie.split( ';' ).length;
		}catch( ex ){
			return 0;
		}
	}
}