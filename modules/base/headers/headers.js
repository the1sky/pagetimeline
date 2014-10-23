/**
 * Created by nant on 2014/8/5.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add headers module done!'} );
    pagetimeline.finishModule();

    pagetimeline.log('headers...');

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var _ = require( 'underscore' )
	var requestId_size = {};

	pagetimeline.setMetric( 'headers_count' ); // @desc number of requests and responses headers
	pagetimeline.setMetric( 'headers_sent_count' ); // @desc number of headers sent in requests
	pagetimeline.setMetric( 'headers_recv_count' ); // @desc number of headers received in responses

	pagetimeline.setMetric( 'headers_size' ); // @desc size of all headers
	pagetimeline.setMetric( 'headers_sent_size' ); // @desc size of sent headers
	pagetimeline.setMetric( 'headers_recv_size' ); // @desc size of received headers

	pagetimeline.setMetric( 'headers_bigger_than_content' ); // @desc number of responses with headers part bigger than the response body

	browser.onDataReceived(function(res){
		var requestId = res['requestId'];
		var len = res['dataLength'];
		if( !requestId_size[requestId] ){
			requestId_size[requestId] = 0;
		}
		requestId_size[requestId] += len;
	});

	browser.onResponseReceived( function(res){
		var requestHeaders = processHeaders( res.response.requestHeaders );
		var responseHeaders = processHeaders( res.response.headers );
		var status = res.response.status;
		var url = res.response.url;
		var requestId = res.requestId;
		var contentLength = res.response.headers['Content-Length'];

		if( /chrome:\/\//.test( url ) ) return;

		contentLength = ( contentLength && contentLength > 0 ) ? contentLength :
			( requestId_size[requestId] != undefined ? requestId_size[requestId] : 0 );

		pagetimeline.incrMetric( 'headers_count', requestHeaders.count );
		pagetimeline.incrMetric( 'headers_size', requestHeaders.size );

		pagetimeline.incrMetric( 'headers_count', responseHeaders.count );
		pagetimeline.incrMetric( 'headers_size', responseHeaders.size );

		pagetimeline.incrMetric( 'headers_sent_count', requestHeaders.count );
		pagetimeline.incrMetric( 'headers_sent_size', requestHeaders.size );

		pagetimeline.incrMetric( 'headers_recv_count', responseHeaders.count );
		pagetimeline.incrMetric( 'headers_recv_size', responseHeaders.size );

		// skip HTTP 204 No Content responses
		if( (status !== 204) && (responseHeaders.size > contentLength) ){
			pagetimeline.incrMetric( 'headers_bigger_than_content' );
			pagetimeline.addOffender( 'headers_bigger_than_content', url + '(body: ' + (contentLength / 1024).toFixed( 2 ) + ' kB / headers: ' + (responseHeaders.size / 1024).toFixed( 2 ) + ' kB)' );
		}
	} );

	function processHeaders(headers){
		var res = {
			count:0,
			size:0
		};
		if( headers ){
			_.forEach( headers, function(headerValue, headerName){
				res.count++;
				res.size += ( headerName + ': ' + headerValue + '\r\n').length;
			} );
		}
		return res;
	}
}
